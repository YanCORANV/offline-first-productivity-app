import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function loadModule(path, imports) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    assert.ok(name in imports, `Unexpected dependency: ${name}`);
    return imports[name];
  }, exports);
  return exports;
}

function table(initial = []) {
  return {
    records: structuredClone(initial),
    async get(id) { return structuredClone(this.records.find((item) => item.id === id)); },
    async toArray() { return structuredClone(this.records); },
    async bulkGet(ids) { return Promise.all(ids.map((id) => this.get(id))); },
    async put(record) {
      this.records = [...this.records.filter((item) => item.id !== record.id), structuredClone(record)];
    },
    async bulkPut(records) { for (const record of records) await this.put(record); },
    async update(id, patch) {
      const record = await this.get(id);
      if (record) await this.put({ ...record, ...patch });
    },
    async bulkUpdate(updates) {
      for (const { key, changes } of updates) await this.update(key, changes);
    },
    async bulkDelete(ids) { this.records = this.records.filter((item) => !ids.includes(item.id)); },
    where(field) {
      return { equals: (value) => ({
        sortBy: async (sort) => structuredClone(this.records.filter((item) => item[field] === value)
          .sort((a, b) => a[sort].localeCompare(b[sort]))),
      }) };
    },
  };
}

function database(initial) {
  const db = Object.fromEntries(Object.entries(initial).map(([key, records]) => [key, table(records)]));
  db.table = (name) => db[name];
  db.transaction = async (_mode, ...args) => {
    const action = args.pop();
    const tables = args.flat();
    const checkpoint = tables.map((item) => structuredClone(item.records));
    try { return await action(); }
    catch (error) {
      tables.forEach((item, index) => { item.records = checkpoint[index]; });
      throw error;
    }
  };
  return db;
}

const settings = { id: "main", version: 1, cloudCursor: 0, timezone: "America/Chicago" };
const pending = {
  id: "op-1", entityType: "task", entityId: "task-1", status: "pending",
  createdAt: "2026-09-08T12:00:00Z", patch: { title: "local edit" },
};

async function syncHarness(t, respond) {
  const db = database({
    settings: [settings], operations: [pending], conflicts: [],
    tasks: [{ id: "task-1", version: 2, title: "local edit" }],
  });
  t.mock.method(globalThis, "fetch", respond);
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout, clearTimeout } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true } });
  t.after(() => {
    for (const [key, descriptor] of [["window", oldWindow], ["navigator", oldNavigator]]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const client = await loadModule("../lib/sync-client.ts", {
    "./domain": {}, "./local-db": { getPlannerDb: () => db },
    "./sync-version": { shouldApplyCloudRecord: (a, b) => !a || b.version >= a.version },
  });
  return { db, client };
}

test("upload 500 still downloads other-device changes and preserves unsent local edits", async (t) => {
  const requests = [];
  const { db, client } = await syncHarness(t, async (url) => {
    requests.push(url);
    if (url.includes("push")) return new Response("failed", { status: 500 });
    return Response.json({ cursor: 12, changes: [
      { entityType: "task", record: { id: "task-1", version: 2, title: "cloud copy" } },
      { entityType: "task", record: { id: "task-2", version: 1, title: "phone task" } },
    ] });
  });
  const result = await client.synchronize(settings);
  assert.equal(result.state, "error");
  assert.match(result.message, /500/);
  assert.equal(requests.length, 3);
  assert.equal((await db.tasks.get("task-1")).title, "local edit");
  assert.equal((await db.tasks.get("task-2")).title, "phone task");
  assert.equal((await db.operations.get("op-1")).status, "pending");
  assert.equal((await db.settings.get("main")).cloudCursor, 12);
});

test("pull failure preserves acknowledged operations and recorded conflicts", async (t) => {
  const { db, client } = await syncHarness(t, async (url) => url.includes("push")
    ? Response.json({ acknowledged: [], conflicts: [{ id: "conflict-1", operationId: "op-1" }] })
    : new Response("failed", { status: 500 }));
  assert.equal((await client.synchronize(settings)).state, "error");
  assert.equal((await db.operations.get("op-1")).status, "conflict");
  assert.equal(db.conflicts.records.length, 1);
});

test("sync uses the persisted cursor and never restores a stale settings snapshot", async (t) => {
  const requests = [];
  const { db, client } = await syncHarness(t, async (url) => {
    requests.push(url);
    await db.settings.update("main", { timezone: "Asia/Shanghai", version: 2 });
    return Response.json({ cursor: 25, changes: [] });
  });
  db.operations.records = [];
  await db.settings.update("main", { cloudCursor: 20 });
  assert.equal((await client.synchronize(settings)).state, "synced");
  assert.equal(requests[0], "/api/sync/pull?cursor=20");
  assert.deepEqual(await db.settings.get("main"), {
    ...settings, timezone: "Asia/Shanghai", version: 2, cloudCursor: 25,
  });
});

test("recovery downloads every page, checkpoints progress and bypasses HTTP caching", async (t) => {
  const requests = [];
  const { db, client } = await syncHarness(t, async (url, init) => {
    assert.equal(init.cache, "no-store");
    requests.push(url);
    const cursor = Number(new URL(url, "https://planner.test").searchParams.get("cursor"));
    if (cursor === 0) return Response.json({ cursor: 10, changes: [
      { entityType: "task", record: { id: "phone", title: "phone", version: 1 } },
    ] });
    if (cursor === 10) {
      assert.equal((await db.settings.get("main")).cloudCursor, 10);
      return Response.json({ cursor: 20, changes: [
        { entityType: "task", record: { id: "desktop", title: "desktop", version: 1 } },
      ] });
    }
    return Response.json({ cursor: 20, changes: [] });
  });
  db.operations.records = [];
  assert.equal((await client.synchronize(settings)).state, "synced");
  assert.deepEqual(requests, ["/api/sync/pull?cursor=0", "/api/sync/pull?cursor=10", "/api/sync/pull?cursor=20"]);
  assert.ok(await db.tasks.get("phone"));
  assert.ok(await db.tasks.get("desktop"));
});

async function workerHarness() {
  const listeners = {};
  const deletedCaches = [];
  const messages = [];
  const cachedApi = Response.json({ cursor: 10, changes: [] });
  let cacheReads = 0;
  let storedSettings = { ...settings, cloudCursor: 13648 };
  const worker = {
    location: new URL("https://planner.test"),
    addEventListener: (name, handler) => { listeners[name] = handler; },
    clients: { claim: async () => {}, matchAll: async () => [{ postMessage: (message) => messages.push(message) }] },
    navigator: { locks: { request: async (_name, action) => action() } },
  };
  const db = {
    objectStoreNames: { contains: (name) => name === "settings" }, close() {},
    transaction() {
      const transaction = {
        objectStore: () => ({
          get() {
            const request = {};
            queueMicrotask(() => {
              request.result = structuredClone(storedSettings);
              request.onsuccess();
              transaction.oncomplete();
            });
            return request;
          },
          put(value) { storedSettings = structuredClone(value); },
        }),
      };
      return transaction;
    },
  };
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  vm.runInNewContext(source, {
    self: worker, URL, Response, Request, Map, Promise, AbortController, setTimeout, clearTimeout,
    caches: {
      keys: async () => ["quiet-plan-shell-v5", "quiet-plan-shell-v6", "other-app"],
      delete: async (key) => { deletedCaches.push(key); },
      match: async () => { cacheReads++; return cachedApi.clone(); },
    },
    indexedDB: { open() {
      const request = {};
      queueMicrotask(() => { request.result = db; request.onsuccess(); });
      return request;
    } },
  });
  return { listeners, deletedCaches, messages, state: () => ({ cacheReads, storedSettings }) };
}

test("service worker never serves a cached API response, even for the identical cursor", async () => {
  const harness = await workerHarness();
  for (const path of ["/api/sync/pull?cursor=10", "/api/status", "/api/ai/status"]) {
    let intercepted = false;
    harness.listeners.fetch({
      request: { method: "GET", url: `https://planner.test${path}`, mode: "cors" },
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false);
  }
  assert.equal(harness.state().cacheReads, 0);
});

test("worker upgrade removes old shell cache and resets only the cursor before requesting sync", async () => {
  const harness = await workerHarness();
  let completion;
  harness.listeners.activate({ waitUntil(promise) { completion = promise; } });
  await completion;
  assert.deepEqual(harness.deletedCaches, ["quiet-plan-shell-v5", "quiet-plan-shell-v6"]);
  assert.deepEqual(harness.state().storedSettings, settings);
  assert.equal(harness.messages[0].type, "PLANNER_SYNC_REQUESTED");
});

async function importHarness(fail = false) {
  let id = 0;
  let syncCount = 0;
  const project = { id: "project-1", goalId: "goal-1", version: 2, order: 0, sourceThoughtIds: ["thought-1"] };
  const link = {
    id: "origin-legacy-random", entityType: "originLink", sourceEntityType: "thought",
    sourceEntityId: "thought-1", targetEntityType: "project", targetEntityId: project.id,
    relationship: "created_from", version: 1, updatedAt: "2026-09-01T00:00:00Z",
  };
  const nodeLink = { ...link, id: "node-link", targetEntityType: "projectNode", targetEntityId: "node-old" };
  const state = {
    projects: [project], projectNodes: [{ id: "node-old", projectId: project.id, version: 1 }],
    scheduleBlocks: [], originLinks: [link, nodeLink],
  };
  const db = database({ ...state, operations: [] });
  if (fail) db.operations.bulkPut = async () => { throw new Error("storage failed"); };
  const { useProjectImportMutations: createImportMutations } = await loadModule(
    "../components/planner-provider/project/project-import-mutations.ts", {
      react: { useCallback: (callback) => callback },
      "@/lib/domain": { newId: (prefix) => `${prefix}-${++id}`, nowIso: () => "2026-09-08T12:00:00Z" },
      "@/lib/local-db": { getPlannerDb: () => db },
      "../internals": {
        active: (record) => !record.deletedAt, sortBlocks: () => 0, sortUpdated: () => 0,
        operationFor: (record, baseVersion, action = "upsert") => ({
          id: `op-${++id}`, entityId: record.id, entityType: record.entityType, action, baseVersion,
        }),
      },
    },
  );
  const setters = Object.fromEntries(Object.keys(state).map((key) => [
    `set${key[0].toUpperCase()}${key.slice(1)}`, (update) => { state[key] = update(state[key]); },
  ]));
  const mutations = createImportMutations({ ...state, ...setters, kickSync: () => { syncCount++; } });
  return { db, state, mutations, link, nodeLink, syncCount: () => syncCount };
}

test("project reimport retains legacy source link IDs and only deletes replaced node links", async () => {
  const { db, state, mutations, link } = await importHarness();
  await mutations.importProjectOutline("goal-1", "Updated", [{ title: "Node" }], ["thought-1", "thought-2", "thought-2"], "project-1");
  assert.deepEqual(await db.originLinks.get(link.id), link);
  assert.equal(db.operations.records.some((operation) => operation.entityId === link.id), false);
  assert.equal(state.originLinks.filter((item) => item.sourceEntityId === "thought-2").length, 1);
  assert.equal(db.operations.records.find((operation) => operation.entityId === "node-link").action, "delete");
  assert.equal(state.originLinks.some((item) => item.id === "node-link"), false);
});

test("project reimport without new sources preserves provenance", async () => {
  const { db, state, mutations, link } = await importHarness();
  await mutations.importProjectOutline("goal-1", "Updated", [{ title: "Node" }], [], "project-1");
  assert.deepEqual(state.originLinks, [link]);
  assert.deepEqual(await db.originLinks.get(link.id), link);
});

test("failed project reimport restores original links once and leaves the queue untouched", async () => {
  const { db, state, mutations, link, nodeLink, syncCount } = await importHarness(true);
  await assert.rejects(mutations.importProjectOutline("goal-1", "Updated", [{ title: "Node" }], ["thought-2"], "project-1"), /storage failed/);
  assert.deepEqual(new Set(state.originLinks.map((item) => item.id)), new Set([link.id, nodeLink.id]));
  assert.equal(state.originLinks.length, 2);
  assert.equal(db.operations.records.length, 0);
  assert.equal(syncCount(), 0);
});
