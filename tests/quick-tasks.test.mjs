import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Exercise the real mutation module with deterministic hooks and a transactional
// storage double. No user database, network or browser is touched.
async function loadModule(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  const require = (name) => {
    assert.ok(name in imports, `Unexpected dependency: ${name}`);
    return imports[name];
  };
  new Function("require", "exports", outputText)(require, exports);
  return exports;
}

const model = await loadModule("../components/views/calendar/calendar-quick-add-model.ts");

test("memo saves every non-empty line, including identical titles, with its completion state", () => {
  assert.deepEqual(model.quickTaskEntries([
    { id: "a", title: "  买牛奶  ", completed: false },
    { id: "b", title: " \t ", completed: true },
    { id: "c", title: "买牛奶", completed: true },
  ]), [
    { title: "买牛奶", completed: false },
    { title: "买牛奶", completed: true },
  ]);
});

test("memo paste preserves surrounding text and accepts Windows and phone line endings", () => {
  assert.deepEqual(model.splitQuickTaskText("前替换后", 1, 3, "第一项\r\n第二项\r第三项\n第四项"), [
    "前第一项", "第二项", "第三项", "第四项后",
  ]);
  assert.deepEqual(model.splitQuickTaskText("两件事情", 2, 2, "\n"), ["两件", "事情"]);
  assert.deepEqual(model.splitQuickTaskText("", 0, 0, "一\n\n二\n"), ["一", "", "二", ""]);
});

async function mutationHarness(failTable) {
  let id = 0;
  let syncCount = 0;
  let tasks = [{ id: "existing", title: "Existing", updatedAt: "2026-09-01T00:00:00.000Z" }];
  let links = [];
  const tables = {};
  for (const name of ["tasks", "originLinks", "operations"]) {
    tables[name] = {
      records: name === "tasks" ? [...tasks] : [],
      async bulkPut(records) {
        this.records.push(...records);
        if (failTable === name) throw new Error(`Failed ${name}`);
      },
    };
  }
  const db = {
    ...tables,
    async transaction(mode, participating, action) {
      assert.equal(mode, "rw");
      assert.deepEqual(new Set(participating), new Set(Object.values(tables)));
      const checkpoints = participating.map((table) => [...table.records]);
      try { await action(); }
      catch (error) {
        participating.forEach((table, index) => { table.records = checkpoints[index]; });
        throw error;
      }
    },
  };
  const domain = {
    newId: (prefix) => `${prefix}-${++id}`,
    nowIso: () => "2026-09-04T16:00:00.000Z",
  };
  const internals = {
    legacyReminder: () => [],
    operationFor: (entity, baseVersion) => ({ id: `op-${entity.id}`, entityId: entity.id, baseVersion }),
    sortUpdated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  };
  const imports = {
    react: { useCallback: (callback) => callback },
    "@/lib/domain": domain,
    "@/lib/local-db": { getPlannerDb: () => db },
    "../internals": internals,
  };
  imports["./origin-link-mutations"] = await loadModule("../components/planner-provider/item/origin-link-mutations.ts", imports);
  const { useTaskMutations: createMutations } = await loadModule("../components/planner-provider/item/task-mutations.ts", imports);
  const mutations = createMutations({
    tasks,
    setTasks: (update) => { tasks = update(tasks); },
    setOriginLinks: (update) => { links = update(links); },
    setScheduleBlocks: () => assert.fail("Quick tasks must not create time blocks"),
    kickSync: () => { syncCount++; },
  });
  return { mutations, db, state: () => ({ tasks, links, syncCount }) };
}

test("batch tasks persist selected date without a start/end time and enqueue sync once", async () => {
  const { mutations, db, state } = await mutationHarness();
  const selectedDay = new Date(2026, 8, 6, 23, 59).toISOString();
  const created = await mutations.addTasks([
    { title: "  写备忘  ", dueAt: selectedDay, planningState: "planned" },
    { title: "已办妥", dueAt: selectedDay, status: "completed", originThoughtIds: ["thought-1"] },
  ]);
  assert.equal(created.length, 2);
  for (const task of created) {
    assert.equal(task.dueAt, selectedDay);
    assert.equal(task.planningState, "planned");
    assert.equal(task.scheduledStartAt, null);
    assert.equal(task.durationMinutes, null);
    assert.equal(task.isAllDay, false);
    assert.deepEqual(task.reminderRules, []);
  }
  assert.equal(created[0].title, "写备忘");
  assert.equal(created[0].completedAt, null);
  assert.equal(created[1].completedAt, "2026-09-04T16:00:00.000Z");
  assert.equal(db.tasks.records.length, 3);
  assert.equal(db.originLinks.records[0].targetEntityId, created[1].id);
  assert.equal(db.operations.records.length, 3);
  assert.equal(state().tasks.length, 3);
  assert.equal(state().links.length, 1);
  assert.equal(state().syncCount, 1);
});

for (const table of ["tasks", "originLinks", "operations"]) {
  test(`failure writing ${table} rolls back the entire batch and preserves existing data`, async () => {
    const { mutations, db, state } = await mutationHarness(table);
    await assert.rejects(mutations.addTasks([
      { title: "第一项", originThoughtIds: ["thought-1"] },
      { title: "第二项" },
    ]), new RegExp(`Failed ${table}`));
    assert.deepEqual(db.tasks.records.map((task) => task.id), ["existing"]);
    assert.deepEqual(state().tasks.map((task) => task.id), ["existing"]);
    assert.deepEqual(db.operations.records, []);
    assert.deepEqual(db.originLinks.records, []);
    assert.deepEqual(state().links, []);
    assert.equal(state().syncCount, 0);
  });
}

test("empty or invalid batches never partially create tasks", async () => {
  const { mutations, state } = await mutationHarness();
  assert.deepEqual(await mutations.addTasks([]), []);
  await assert.rejects(mutations.addTasks([{ title: "Valid" }, { title: "  " }]), /不能为空/);
  assert.equal(state().tasks.length, 1);
  assert.equal(state().syncCount, 0);
});

test("single-task creation keeps the same defaults after sharing batch persistence", async () => {
  const { mutations, state } = await mutationHarness();
  const task = await mutations.addTask({ title: "原有新增", planningState: "draft" });
  assert.equal(task.planningState, "draft");
  assert.equal(task.dueAt, null);
  assert.equal(task.status, "open");
  assert.equal(task.version, 1);
  assert.equal(state().syncCount, 1);
});

test("memo blocks duplicate saves and closing while pending, then retains the draft for retry", async () => {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
      return [slots[slot], (update) => {
        slots[slot] = typeof update === "function" ? update(slots[slot]) : update;
      }];
    },
    useRef(initial) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useEffect() {},
    useLayoutEffect() {},
  };
  let attemptCount = 0;
  let closedDraft;
  let rejectSave;
  const { useCalendarQuickAdd: createEditor } = await loadModule(
    "../components/views/calendar/calendar-quick-add-controller.ts",
    { react, "@/lib/domain": { newId: () => "unused" }, "./calendar-quick-add-model": model },
  );
  const initialRows = [{ id: "memo-1", title: "未保存的输入", completed: false }];
  const props = {
    initialRows,
    onClose: (rows) => { closedDraft = rows; },
    onSave: () => {
      attemptCount++;
      return new Promise((resolve, reject) => { rejectSave = reject; });
    },
  };
  const renderEditor = () => { cursor = 0; return createEditor(props); };
  const editor = renderEditor();
  const pending = editor.submit();
  await editor.submit();
  editor.close();
  editor.updateRow("memo-1", { title: "不能在保存期间修改" });
  assert.equal(attemptCount, 1);
  assert.equal(closedDraft, undefined);
  assert.equal(renderEditor().saving, true);
  rejectSave(new Error("Storage unavailable"));
  await pending;
  const retryEditor = renderEditor();
  assert.equal(retryEditor.saving, false);
  assert.deepEqual(retryEditor.rows, initialRows);
  assert.match(retryEditor.error, /内容已保留/);
  retryEditor.close();
  assert.deepEqual(closedDraft, initialRows);
  const retry = retryEditor.submit();
  assert.equal(attemptCount, 2);
  rejectSave(new Error("Still unavailable"));
  await retry;
});
