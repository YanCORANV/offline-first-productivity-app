import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import * as domain from "../lib/domain.ts";
import * as planning from "../lib/planning.ts";

async function loadModule(path, imports) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    assert.ok(name in imports, name);
    return imports[name];
  }, exports);
  return exports;
}
const imports = {
  "@/lib/domain": domain, "@/lib/planning": planning,
  react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
};
const model = await loadModule("../components/views/calendar/calendar-model.ts", imports);
imports["./calendar-model"] = model;
const card = await loadModule("../components/views/calendar/calendar-entry-card.tsx", imports);
imports["./calendar-entry-card"] = card;
imports["./calendar-popover"] = await loadModule("../components/views/calendar/calendar-popover.tsx", imports);
imports["./use-calendar-timeline-height"] = await loadModule("../components/views/calendar/use-calendar-timeline-height.ts", imports);
const { TimeGrid } = await loadModule("../components/views/calendar/time-grid.tsx", imports);
const { scale } = planning.buildCalendarTimelineScale(480, 1560, model.TWO_HOUR_HEIGHT);
const date = (hour, minute = 0) => new Date(2026, 8, 8, hour, minute).toISOString();
function entry(id, hour, minute, duration, course = false) {
  return {
    kind: course ? "event" : "task",
    item: { id, title: id, status: "open", eventKind: course ? "course" : undefined },
    at: date(hour, minute),
    endAt: date(hour, minute + duration),
    color: "#d3a29e",
    instanceKey: id,
  };
}
const layout = (entries) => model.positionEntries(entries, scale, 480, 1560);
const props = {
  tasks: [], events: [], blocks: [], nodes: [], goals: [], projects: [],
  displayStart: "08:00", displayEnd: "02:00",
  onTask() {}, onEvent() {}, onBlock() {}, onQuickAdd() {},
};

test("short cards keep a draggable title and completion controls, including restored occurrences", async () => {
  const task = entry("short", 10, 0, 1);
  let html = renderToStaticMarkup(React.createElement(card.CalendarEntryCard, { ...props, entry: task, summaryOnly: true }));
  assert.match(html, /aria-label="完成 short"/);
  assert.match(html, /class="calendar-item-main"[^>]*draggable="true"/);
  task.item.recurrenceRule = "FREQ=DAILY";
  task.occurrenceAt = date(10);
  task.item.completedOccurrenceKeys = [domain.localDateKey(new Date(date(10)))];
  html = renderToStaticMarkup(React.createElement(card.CalendarEntryCard, { ...props, entry: task, summaryOnly: true }));
  assert.match(html, /aria-label="恢复 short"/);
  assert.doesNotMatch(html, /draggable="true"/);
  const failedTask = entry("failed-item", 10, 0, 1);
  failedTask.item.status = "failed";
  const failedHtml = renderToStaticMarkup(React.createElement(card.CalendarEntryCard, { ...props, entry: failedTask }));
  assert.match(failedHtml, /is-failed/);
  assert.match(failedHtml, /aria-label="恢复 failed-item"/);
  assert.match(failedHtml, /lucide-x/);
  const css = await readFile(new URL("../components/views/calendar/calendar-entry-card.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.calendar-drag-handle\s*\{\s*display:\s*none/);
  assert.match(css, /\.time-calendar-item:focus-within\s*\{\s*min-height:\s*3\.5rem/);
});

test("date-only recurring tasks retain the clicked occurrence for edit and completion", () => {
  const day = new Date(2026, 8, 9);
  const task = {
    id: "recurring", title: "recurring", taskKind: "ordinary", planningState: "planned",
    dueAt: date(23, 59), scheduledStartAt: null,
    recurrenceRule: domain.parseRepeatPreset("daily", date(23, 59)),
  };
  const items = model.entriesForDay(day, { ...props, tasks: [task], itemColor: () => "#abc" });
  assert.equal(items.length, 1);
  assert.equal(items[0].at, "");
  assert.equal(domain.localDateKey(new Date(items[0].occurrenceAt)), domain.localDateKey(day));
});

async function composerHarness({ recurring = false, fail = false } = {}) {
  const values = [];
  let cursor = 0;
  let effects = [];
  let closed = false;
  const calls = [];
  const task = {
    id: "short", title: "short", taskKind: "ordinary", planningState: "planned", status: "open",
    scheduledStartAt: date(10), dueAt: date(23, 59), durationMinutes: 1,
    itemTypeId: "temporary", completedAt: null, completedOccurrenceKeys: [],
    recurrenceRule: recurring ? "FREQ=DAILY" : null,
  };
  const occurrenceAt = new Date(2026, 8, 9, 10).toISOString();
  const planner = {
    tasks: [structuredClone(task)], thoughts: [],
    settings: { itemTypes: [{ id: "temporary", name: "临时", color: "#abc" }] },
    async toggleTask(id, at) {
      calls.push({ id, at });
      if (fail) throw new Error("storage failure");
      const current = planner.tasks[0];
      const completed = recurring
        ? !domain.isTaskOccurrenceCompleted(current, at)
        : current.status !== "completed";
      planner.tasks = [{ ...current,
        status: recurring ? "open" : completed ? "completed" : "open",
        completedAt: completed ? at : null,
        completedOccurrenceKeys: recurring && completed ? [domain.localDateKey(new Date(at))] : [],
      }];
    },
    async updateTask(id, patch) {
      calls.push({ id, patch });
      planner.tasks = [{ ...planner.tasks[0], ...patch }];
    },
  };
  const { TaskComposer } = await loadModule("../components/task-composer/task-composer.tsx", {
    ...imports,
    react: { ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in values)) values[index] = initial;
        return [values[index], (value) => { values[index] = typeof value === "function" ? value(values[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in values)) values[index] = { current: initial };
        return values[index];
      },
      useEffect(effect) { effects.push(effect); },
    },
    rrule: await import("rrule"),
    "./task-composer.css": {},
    "../planner-provider": { usePlanner: () => planner },
    "../composer-shell": { InspectorShell: "inspector" },
    "../composer-shared": { makeRules: () => [] },
    "./actions": { ComposerActions: "actions" },
    "./sections": { TaskTitleSection: "title", TaskScheduleSection: "schedule", TaskOrganizationSection: "organization" },
  });
  function render() {
    cursor = 0;
    effects = [];
    const tree = TaskComposer({ open: true, task, occurrenceAt, onClose: () => { closed = true; } });
    effects.forEach((effect) => effect());
    const form = tree.props.children;
    return { form, title: form.props.children[0], completion: form.props.children[0].props.children };
  }
  render();
  return { render, planner, calls, occurrenceAt, closed: () => closed };
}

test("editor completion preserves unsaved text and a later save keeps the live completed state", async () => {
  const harness = await composerHarness();
  let view = harness.render();
  view.title.props.onTitleChange("edited title");
  view.form.props.onChange();
  view = harness.render();
  view.completion.props.onClick();
  await new Promise(setImmediate);
  view = harness.render();
  assert.equal(view.completion.props["aria-pressed"], true);
  assert.equal(view.title.props.title, "edited title");
  assert.equal(harness.closed(), false);
  await view.form.props.onSubmit({ preventDefault() {} });
  assert.equal(harness.planner.tasks[0].status, "completed");
  assert.equal(harness.planner.tasks[0].title, "edited title");
});

test("editor can restore only the clicked recurrence and reports completion failures without closing", async () => {
  const harness = await composerHarness({ recurring: true });
  harness.render().completion.props.onClick();
  await new Promise(setImmediate);
  assert.equal(harness.calls[0].at, harness.occurrenceAt);
  assert.equal(harness.planner.tasks[0].status, "open");
  assert.equal(harness.render().completion.props["aria-pressed"], true);
  harness.render().completion.props.onClick();
  await new Promise(setImmediate);
  assert.deepEqual(harness.planner.tasks[0].completedOccurrenceKeys, []);
  assert.equal(harness.render().completion.props["aria-pressed"], false);
  const failed = await composerHarness({ fail: true });
  failed.render().completion.props.onClick();
  await new Promise(setImmediate);
  const view = failed.render();
  assert.equal(view.completion.props.disabled, false);
  assert.equal(view.completion.props["aria-pressed"], false);
  assert.equal(failed.closed(), false);
  assert.match(view.form.props.children.find((child) => child?.props?.role === "alert").props.children, /更新失败/);
});

test("timeline fits the viewport budget for short, long and overnight display windows", () => {
  for (const available of [240, 450, 700]) {
    for (const [start, end] of [[480, 1320], [480, 1560], [0, 1440]]) {
      const pixels = model.fittedCalendarHourScale(start, end, available);
      const { scale } = planning.buildCalendarTimelineScale(start, end, pixels);
      assert.ok(scale.height + model.TIMELINE_PADDING * 2 + model.CALENDAR_ENTRY_MIN_HEIGHT <= available + 0.001);
      const [last] = model.positionEntries([entry("last", Math.floor(end / 60), end % 60, 0)], scale, start, end);
      assert.ok(last.top + last.height <= available);
      for (const minute of [start, (start + end) / 2, end]) {
        assert.ok(Math.abs(planning.compactTimelineMinuteAtY(planning.compactTimelineY(minute, scale), scale) - minute) < 0.001);
      }
    }
  }
});

test("a 50-minute task has separate-row space without changing its timestamps or start position", () => {
  const task = entry("330-quiz", 10, 0, 50);
  const before = structuredClone(task);
  const [position] = layout([task]);
  assert.equal(position.height, 50);
  assert.equal(position.top, model.TIMELINE_PADDING + planning.compactTimelineY(600, scale));
  assert.equal(position.lanes, 1);
  assert.deepEqual(task, before);
  const html = renderToStaticMarkup(React.createElement(card.CalendarEntryCard, { ...props, entry: task }));
  assert.match(html, /calendar-time-start">10:00/);
  assert.match(html, /calendar-time-end">–10:50/);
  assert.match(html, /<strong[^>]*>330-quiz<\/strong>/);
  assert.match(html, /aria-label="330-quiz · 10:00–10:50"/);
});

test("overlapping course and task use separate readable lanes; unrelated later entries stay full width", () => {
  const positioned = layout([
    entry("330-quiz", 10, 0, 50),
    entry("ECE364", 9, 30, 80, true),
    entry("later", 12, 0, 50),
  ]);
  assert.deepEqual(positioned.map(({ lane, lanes }) => [lane, lanes]), [[0, 2], [1, 2], [0, 1]]);
});

test("non-overlapping short entries are not falsely assigned parallel lanes", () => {
  const items = [entry("a", 10, 0, 10), entry("b", 10, 10, 10), entry("c", 10, 20, 10)];
  const positioned = layout(items);
  assert.deepEqual(positioned.map((item) => [item.lane, item.lanes]), [[0, 1], [0, 1], [0, 1]]);
  for (let i = 0; i < positioned.length; i++) {
    assert.equal(positioned[i].top, model.TIMELINE_PADDING + planning.compactTimelineY(600 + i * 10, scale));
  }
});

test("lane reuse follows actual end times", () => {
  const positioned = layout([entry("long", 9, 0, 240), entry("first", 9, 0, 60), entry("next", 10, 15, 60)]);
  assert.deepEqual(positioned.map((item) => [item.lane, item.lanes]), [[0, 2], [1, 2], [1, 2]]);
  assert.ok(positioned[1].top + positioned[1].height <= positioned[2].top);
});

test("fitted short labels never cover a following non-overlapping entry", () => {
  const { scale } = planning.buildCalendarTimelineScale(480, 1560, model.fittedCalendarHourScale(480, 1560, 400));
  const positioned = model.positionEntries([entry("HK102", 13, 0, 50, true), entry("ECE391", 14, 0, 80, true)], scale, 480, 1560);
  assert.ok(positioned[0].top + positioned[0].height < positioned[1].top);
  assert.deepEqual(positioned.map(({ lane, lanes }) => [lane, lanes]), [[0, 1], [0, 1]]);
});

test("point-only and cross-midnight items keep their data and remain readable", () => {
  const items = [entry("point", 10, 0, 0), entry("overnight", 23, 45, 60)];
  const positioned = layout(items);
  assert.ok(positioned.every((item) => item.height >= model.CALENDAR_ENTRY_MIN_HEIGHT));
  assert.equal(positioned[1].top, model.TIMELINE_PADDING + planning.compactTimelineY(1425, scale));
  assert.equal(positioned[0].entry.endAt, items[0].at);
});

test("headings, all-day entries and timed entries share one column definition for week and single-day grids", async () => {
  const day = new Date(2026, 8, 8);
  const items = [entry("a", 10, 0, 50), entry("b", 10, 0, 50)];
  for (const days of [[day], [day, new Date(2026, 8, 9)]]) {
    const html = renderToStaticMarkup(React.createElement(TimeGrid, {
      ...props, days, entriesByDay: new Map([[day.getTime(), items]]),
    }));
    assert.match(html, /--calendar-days:/);
    assert.doesNotMatch(html, /calendar-days-min-width|is-condensed|is-roomy/);
  }
  const css = await readFile(new URL("../components/views/calendar/time-grid.css", import.meta.url), "utf8");
  assert.match(css, /\.time-grid-day-headings,\s*\.time-grid-all-day,\s*\.time-grid-days\s*\{\s*grid-template-columns: repeat\(var\(--calendar-days, 7\), minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-rows: max-content max-content max-content/);
  assert.match(css, /align-content: start/);
  assert.doesNotMatch(css, /calendar-lane-min-width|calendar-days-min-width|overflow:\s*auto/);
});

test("13:00–13:50 and 14:00–15:20 stay aligned rather than forming a false conflict", () => {
  const positioned = layout([entry("HK102", 13, 0, 50, true), entry("ECE391", 14, 0, 80, true)]);
  assert.deepEqual(positioned.map(({ lane, lanes }) => [lane, lanes]), [[0, 1], [0, 1]]);
  assert.ok(positioned[0].top + positioned[0].height < positioned[1].top);
});

test("only explicit all-day tasks tint the whole day, not date-only or scheduled entries", () => {
  const allDay = { ...entry("all day", 10, 0, 50), at: "", endAt: "" };
  allDay.item.isAllDay = true;
  const dateOnly = { ...allDay, item: { ...allDay.item, isAllDay: false } };
  assert.equal(model.isAllDayEntry(allDay), true);
  assert.equal(model.isAllDayEntry(dateOnly), false);
  assert.equal(model.isAllDayEntry(entry("timed", 10, 0, 50)), false);
  const day = new Date(2026, 8, 8);
  const html = renderToStaticMarkup(React.createElement(TimeGrid, {
    ...props, days: [day], entriesByDay: new Map([[day.getTime(), [allDay, dateOnly]]]),
  }));
  assert.equal((html.match(/class="calendar-day-colors"/g) ?? []).length, 2);
  assert.match(html, /class="calendar-selected-day"/);
});

test("overview is a manual presentation choice and lists real titles without detail metadata", () => {
  const day = new Date(2026, 8, 8);
  const item = entry("330-quiz", 10, 0, 50);
  item.item.notes = "Private detail";
  const html = renderToStaticMarkup(React.createElement(TimeGrid, {
    ...props, days: [day], entriesByDay: new Map([[day.getTime(), [item]]]),
  }));
  assert.doesNotMatch(html, /周视图呈现方式|calendar-presentation/);
  assert.match(html, /class="time-grid is-overview/);
  const overview = html.split('class="calendar-week-overview"')[1].split('class="calendar-selected-day"')[0];
  assert.match(overview, /330-quiz/);
  assert.match(overview, /10:00/);
  assert.match(overview, /10:50/);
  assert.doesNotMatch(overview, /<i |<small|item-inline-check/);
});

test("fitted cards preserve the full ten-minute gap instead of stretching minimum height", () => {
  const { scale } = planning.buildCalendarTimelineScale(480, 1560, model.fittedCalendarHourScale(480, 1560, 600));
  const [first, next] = model.positionEntries([entry("first", 10, 0, 50), entry("next", 11, 0, 50)], scale, 480, 1560);
  const expected = planning.compactTimelineY(660, scale) - planning.compactTimelineY(650, scale);
  assert.ok(Math.abs(next.top - first.top - first.height - expected) < 0.001);
});

test("one toolbar segmented control owns the three calendar presentations", async () => {
  const { CalendarToolbar } = await loadModule("../components/views/calendar/calendar-toolbar.tsx", imports);
  const html = renderToStaticMarkup(React.createElement(CalendarToolbar, { view: "timeline", hideCourses: false }));
  assert.match(html, /aria-label="日历视图"/);
  assert.match(html, /value="overview">周概览/);
  assert.match(html, /aria-checked="true"[^>]*value="timeline">周时间轴/);
  assert.match(html, /value="month">月视图/);
  assert.match(html, /aria-pressed="false"[^>]*>[\s\S]*隐藏课程表/);
  assert.doesNotMatch(html, /popover|更多日历操作/);
  const hidden = renderToStaticMarkup(React.createElement(CalendarToolbar, { view: "timeline", hideCourses: true }));
  assert.match(hidden, /aria-pressed="true"[^>]*>[\s\S]*显示课程表/);
});
