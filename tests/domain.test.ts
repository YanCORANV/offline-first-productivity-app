import assert from "node:assert/strict";
import test from "node:test";
import * as rruleModule from "rrule";
import {
  computeReminderAt,
  DEFAULT_SETTINGS,
  courseWeekdayForDate,
  detectPatchConflict,
  eventOccurrenceOnDay,
  expandRecurrence,
  firstCourseDateOnOrAfter,
  isTaskOccurrenceCompleted,
  localDateKey,
  makeCourseRecurrenceRule,
  makeCustomRepeatRule,
  mergeDisjointPatch,
  normalizeFragmentMinutes,
  normalizeItemTypes,
  parseRepeatPreset,
  recurrenceWeekdays,
  taskOccurrenceOnDay,
  taskOccurrencesOnDay,
  type CalendarEvent,
  type PlannerTask,
} from "../lib/domain.ts";
import {
  aiToolResultSchema,
  normalizeAiToolResultInput,
} from "../lib/server/schemas.ts";
import { shouldApplyCloudRecord } from "../lib/sync-version.ts";
import {
  buildCalendarTimelineScale,
  buildAdvanceCandidates,
  buildCompactTimelineScale,
  buildProjectTreeIndex,
  compactTimelineMinuteAtY,
  compactTimelineY,
  formatGapDuration,
  freeTimeRanges,
  isLeafNode,
  nextCourseTaskSlot,
  parseProjectMarkdown,
  parseProjectOutline,
  projectProgress,
  recommendationLimit,
  recommendationTargetDate,
  recommendCandidatesForGaps,
  resolveTimelineWindow,
  timelineOffsetMinutes,
  wouldCreateCycle,
  type AdvanceCandidate,
} from "../lib/planning.ts";
import type { ProjectNode } from "../lib/domain.ts";
import { mergeSettingsForm } from "../components/views/settings/settings-model.ts";

const rruleRuntime = (Reflect.get(rruleModule, "default") ?? rruleModule) as typeof import("rrule");
const { RRule } = rruleRuntime;

test("settings sync preserves an edited arbitrary color while updating untouched fields", () => {
  const previous = { ...DEFAULT_SETTINGS, version: 1 };
  const draft = {
    ...previous,
    itemTypes: previous.itemTypes.map((type) => type.id === "research" ? { ...type, color: "#1276e3" } : type),
  };
  const incoming = { ...previous, version: 2, defaultWakeTime: "07:30" };
  const merged = mergeSettingsForm(previous, draft, incoming);
  assert.equal(merged.defaultWakeTime, "07:30");
  assert.equal(merged.itemTypes[0].color, "#1276e3");
  assert.equal(normalizeItemTypes(merged.itemTypes)[0].color, "#1276e3");
  const saved = { ...incoming, itemTypes: merged.itemTypes, version: 3 };
  assert.deepEqual(mergeSettingsForm(incoming, merged, saved), saved);
});

test("a failed settings save keeps edited colors and times available for retry", () => {
  const original = { ...DEFAULT_SETTINGS, version: 1 };
  const optimistic = {
    ...original,
    version: 2,
    defaultWakeTime: "06:15",
    itemTypes: original.itemTypes.map((type) => ({ ...type, color: "#f58220" })),
  };
  const restored = mergeSettingsForm(optimistic, optimistic, original);
  assert.equal(restored.version, 1);
  assert.equal(restored.defaultWakeTime, "06:15");
  assert.equal(restored.itemTypes[0].color, "#f58220");
});

test("default item types include music while preserving custom choices", () => {
  const types = normalizeItemTypes([
    { id: "custom-reading", name: "阅读", color: "#A9C4C0" },
  ]);

  assert.equal(types.find((item) => item.id === "music")?.name, "音乐");
  assert.equal(types.find((item) => item.id === "course")?.name, "课程");
  assert.equal(types.find((item) => item.id === "custom-reading")?.name, "阅读");
});

test("reminder offsets preserve the absolute instant across DST offsets", () => {
  assert.equal(
    computeReminderAt("2026-03-08T09:00:00-04:00", 60),
    "2026-03-08T12:00:00.000Z",
  );
  assert.equal(computeReminderAt("2026-11-01T09:00:00-05:00", 30), "2026-11-01T13:30:00.000Z");
});

test("weekly presets retain the selected weekday", () => {
  const rule = parseRepeatPreset("weekly", "2026-07-29T09:00:00.000Z");
  assert.ok(rule);
  const parsed = RRule.fromString(rule!);
  assert.equal(parsed.options.freq, RRule.WEEKLY);
  assert.deepEqual(parsed.options.byweekday, [RRule.WE.weekday]);
});

test("weekly recurrence matches local weekday without timezone shift", () => {
  // Oct 22, 2026 is a Thursday
  const noonAnchor = new Date(2026, 9, 22, 12, 0, 0).toISOString();
  const rule = makeCustomRepeatRule("weekly", 1, [3], noonAnchor, "2026-11-20");
  assert.ok(rule);
  assert.deepEqual(recurrenceWeekdays(rule, noonAnchor), [3]);

  const occurrences = expandRecurrence(
    rule,
    new Date(2026, 9, 20, 0, 0, 0),
    new Date(2026, 10, 25, 0, 0, 0),
  );
  const keys = occurrences.map(localDateKey);
  assert.deepEqual(keys, [
    "2026-10-22",
    "2026-10-29",
    "2026-11-05",
    "2026-11-12",
    "2026-11-19",
  ]);
  // Verify Wednesday is never included
  assert.equal(keys.includes("2026-10-28"), false);
  assert.equal(keys.includes("2026-11-04"), false);
});

test("legacy recurrence rules created with 23:59 day-end anchor are normalized to local daytime", () => {
  const legacyRule = "DTSTART:20261023T045900Z\nRRULE:FREQ=WEEKLY;BYDAY=TH";
  const occurrences = expandRecurrence(
    legacyRule,
    new Date(2026, 9, 20, 0, 0, 0),
    new Date(2026, 10, 25, 0, 0, 0),
  );
  const keys = occurrences.map(localDateKey);
  assert.equal(keys.includes("2026-10-28"), false);
  assert.equal(keys.includes("2026-11-04"), false);
  assert.ok(keys.includes("2026-10-22"));
  assert.ok(keys.includes("2026-10-29"));
  assert.ok(keys.includes("2026-11-05"));
});

test("course recurrence supports several meetings in one week", () => {
  assert.equal(courseWeekdayForDate("2026-08-25"), 1);
  assert.equal(firstCourseDateOnOrAfter("2026-08-25", [2, 4]), "2026-08-26");

  const firstStart = new Date(2026, 7, 26, 9, 0, 0).toISOString();
  const rule = makeCourseRecurrenceRule(firstStart, [2, 4], "2026-09-04");
  assert.ok(rule);
  assert.deepEqual(recurrenceWeekdays(rule), [2, 4]);
  const occurrences = expandRecurrence(
    rule,
    new Date(2026, 7, 24, 0, 0, 0),
    new Date(2026, 8, 5, 0, 0, 0),
  );
  assert.deepEqual(occurrences.map(localDateKey), [
    "2026-08-26",
    "2026-08-28",
    "2026-09-02",
    "2026-09-04",
  ]);
});

test("course task slots advance within one class occurrence", () => {
  const courseStart = "2026-08-25T15:00:00.000Z";
  const courseEnd = "2026-08-25T16:20:00.000Z";
  const first = nextCourseTaskSlot(courseStart, courseEnd, []);
  assert.deepEqual(first, {
    startAt: courseStart,
    durationMinutes: 30,
  });

  const second = nextCourseTaskSlot(courseStart, courseEnd, [{
    scheduledStartAt: first.startAt,
    durationMinutes: first.durationMinutes,
  }]);
  assert.deepEqual(second, {
    startAt: "2026-08-25T15:30:00.000Z",
    durationMinutes: 30,
  });

  const third = nextCourseTaskSlot(courseStart, courseEnd, [
    { scheduledStartAt: first.startAt, durationMinutes: first.durationMinutes },
    { scheduledStartAt: second.startAt, durationMinutes: second.durationMinutes },
  ]);
  assert.deepEqual(third, {
    startAt: "2026-08-25T16:00:00.000Z",
    durationMinutes: 20,
  });
});

test("course weekday parsing does not shift Tuesday and Thursday", () => {
  const rule = makeCourseRecurrenceRule(
    new Date(2026, 7, 25, 14, 0, 0).toISOString(),
    [1, 3],
    "2026-12-08",
  );

  assert.deepEqual(recurrenceWeekdays(rule), [1, 3]);
});

test("course-style weekly recurrence can stop on a selected date", () => {
  const rule = parseRepeatPreset(
    "weekly",
    "2026-07-29T09:00:00.000Z",
    "2026-09-01",
  );
  const parsed = RRule.fromString(rule!);
  assert.ok(parsed.options.until);
  assert.equal(parsed.options.until!.getUTCFullYear(), 2026);
});

test("sparse timeline keeps linear spacing and expands for early events", () => {
  const day = new Date(2026, 6, 29, 12);
  const window = resolveTimelineWindow(day, "08:00", "02:00", [
    {
      startAt: new Date(2026, 6, 29, 6, 30).toISOString(),
      endAt: new Date(2026, 6, 29, 7, 15).toISOString(),
    },
  ]);
  assert.equal(window.start.getHours(), 6);
  assert.equal(window.start.getMinutes(), 30);
  assert.equal(window.end.getDate(), 30);
  assert.equal(window.end.getHours(), 2);
  assert.equal(
    timelineOffsetMinutes(new Date(2026, 6, 29, 8, 30), window),
    120,
  );
});

test("compact timeline labels and compresses long empty stretches reversibly", () => {
  const scale = buildCompactTimelineScale(
    8 * 60,
    26 * 60,
    [{ startMinute: 9 * 60, endMinute: 10 * 60 }],
    60,
  );
  const longGap = scale.segments.find(
    (segment) => segment.isGap && segment.endMinute - segment.startMinute > 60,
  );

  assert.ok(longGap);
  assert.ok(longGap.height < 60);
  assert.equal(formatGapDuration(120), "2h");
  const minute = 14 * 60 + 15;
  const recovered = compactTimelineMinuteAtY(compactTimelineY(minute, scale), scale);
  assert.ok(Math.abs(recovered - minute) < 0.001);
});

test("calendar timeline keeps the exact Settings display range", () => {
  const { scale, markerMinutes } = buildCalendarTimelineScale(
    8 * 60,
    26 * 60,
  );

  assert.equal(scale.startMinute, 8 * 60);
  assert.equal(scale.endMinute, 26 * 60);
  assert.deepEqual(markerMinutes, [480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560]);
  assert.equal(
    compactTimelineMinuteAtY(compactTimelineY(13 * 60 + 45, scale), scale),
    13 * 60 + 45,
  );
});

test("recurring tasks and events appear in later calendar ranges", () => {
  const recurrenceRule = parseRepeatPreset("daily", "2026-07-29T01:00:00.000Z");
  const task = {
    id: "task-1",
    entityType: "task",
    planningState: "planned",
    taskKind: "ordinary",
    title: "Daily",
    notes: "",
    itemTypeId: "research",
    status: "open",
    scheduledStartAt: "2026-07-29T01:00:00.000Z",
    recurrenceRule,
    reminderRules: [],
    completedOccurrenceKeys: ["2026-07-30"],
    originThoughtIds: [],
    createdAt: "2026-07-29T01:00:00.000Z",
    updatedAt: "2026-07-29T01:00:00.000Z",
    version: 1,
  } satisfies PlannerTask;
  const event = {
    id: "event-1",
    entityType: "event",
    eventKind: "event",
    title: "Daily event",
    notes: "",
    status: "open",
    itemTypeId: "temporary",
    startAt: "2026-07-29T01:00:00.000Z",
    endAt: "2026-07-29T01:30:00.000Z",
    recurrenceRule,
    reminderRules: [],
    timezone: "Asia/Shanghai",
    originThoughtIds: [],
    createdAt: "2026-07-29T01:00:00.000Z",
    updatedAt: "2026-07-29T01:00:00.000Z",
    version: 1,
  } satisfies CalendarEvent;
  const nextDay = new Date(2026, 6, 30, 12);
  const taskOccurrence = taskOccurrenceOnDay(task, nextDay);
  assert.ok(taskOccurrence);
  assert.equal(isTaskOccurrenceCompleted(task, taskOccurrence!), true);
  assert.ok(eventOccurrenceOnDay(event, nextDay));
  const excludedEvent: CalendarEvent = {
    ...event,
    excludedOccurrenceKeys: [localDateKey(nextDay)],
  };
  assert.equal(eventOccurrenceOnDay(excludedEvent, nextDay), null);
});


test("cloud changes cannot overwrite a newer local undo", () => {
  assert.equal(
    shouldApplyCloudRecord({ id: "event-1", version: 7 }, { id: "event-1", version: 6 }),
    false,
  );
  assert.equal(
    shouldApplyCloudRecord({ id: "event-1", version: 7 }, { id: "event-1", version: 7 }),
    true,
  );
});
test("draft tasks stay out of the calendar until a date is confirmed", () => {
  const task = {
    id: "task-draft",
    entityType: "task",
    planningState: "draft",
    taskKind: "ordinary",
    title: "Still deciding",
    notes: "",
    itemTypeId: "temporary",
    status: "open",
    dueAt: "2026-07-29T15:59:00.000Z",
    scheduledStartAt: null,
    recurrenceRule: null,
    reminderRules: [],
    completedOccurrenceKeys: [],
    originThoughtIds: [],
    createdAt: "2026-07-29T01:00:00.000Z",
    updatedAt: "2026-07-29T01:00:00.000Z",
    version: 1,
  } satisfies PlannerTask;
  assert.equal(taskOccurrenceOnDay(task, new Date(2026, 6, 29, 12)), null);
});

test("disjoint edits merge while same-field edits surface a conflict", () => {
  const server = { title: "Server title", notes: "Original" };
  assert.deepEqual(detectPatchConflict({ notes: "Local" }, ["title"]), []);
  assert.deepEqual(mergeDisjointPatch(server, { notes: "Local" }, ["title"]), {
    record: { title: "Server title", notes: "Local" },
    conflicts: [],
  });
  assert.deepEqual(detectPatchConflict({ title: "Local title" }, ["title"]), ["title"]);
});

test("AI tool output rejects unsupported actions", () => {
  const valid = {
    suggestions: [
      {
        clientKey: "a",
        type: "task",
        thoughtIds: ["thought-1"],
        title: "Send the draft",
        rationale: "It has a concrete next action.",
      },
    ],
  };
  assert.equal(aiToolResultSchema.parse(valid).suggestions.length, 1);
  assert.equal(
    aiToolResultSchema.safeParse({
      suggestions: [{ ...valid.suggestions[0], type: "auto_execute" }],
    }).success,
    false,
  );
});

test("AI tool output normalizes valid offset times before strict validation", () => {
  const normalized = normalizeAiToolResultInput({
    suggestions: [{
      clientKey: "offset-time",
      type: "event",
      thoughtIds: ["thought-1"],
      title: "联系导师",
      rationale: "需要确认具体时间",
      scheduledStartAt: "2026-07-30T10:00:00+08:00",
      dueAt: "",
      durationMinutes: "30",
    }],
  });
  const parsed = aiToolResultSchema.parse(normalized);
  assert.equal(parsed.suggestions[0].scheduledStartAt, "2026-07-30T02:00:00.000Z");
  assert.equal(parsed.suggestions[0].dueAt, null);
  assert.equal(parsed.suggestions[0].durationMinutes, 30);
});

test("outline import preserves hierarchy and reports ambiguous plain lines", () => {
  const result = parseProjectOutline(
    "# Research\n- Read papers\n  - Extract evidence\nPlain note",
  );
  assert.deepEqual(
    result.map((item) => [item.title, item.parentIndex]),
    [
      ["Read papers", null],
      ["Extract evidence", 0],
      ["Plain note", null],
    ],
  );
  assert.equal(result[2].warning, "未识别到列表标记");
});

test("project Markdown keeps Goal, Project and leaf checkpoints simple", () => {
  const parsed = parseProjectMarkdown(`---
goal: 科研
project: 暑期实习
---

# 暑期实习

- 前期准备
  - [ ] 完成简历
  - [ ] 整理目标公司`);
  assert.equal(parsed.goal, "科研");
  assert.equal(parsed.project, "暑期实习");
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(
    parsed.candidates.map((item) => [item.title, item.parentIndex, item.checkpoint]),
    [
      ["前期准备", null, false],
      ["完成简历", 0, true],
      ["整理目标公司", 0, true],
    ],
  );
});

test("project progress derives from leaves and cycle checks reject descendants", () => {
  const time = "2026-07-29T01:00:00.000Z";
  const nodes = [
    node("root", null, "open", time),
    node("leaf-a", "root", "completed", time),
    node("branch", "root", "open", time),
    node("leaf-b", "branch", "open", time),
  ];
  assert.equal(isLeafNode("root", nodes), false);
  assert.equal(isLeafNode("leaf-a", nodes), true);
  assert.deepEqual(projectProgress("project-1", nodes), {
    completed: 1,
    total: 2,
    ratio: 0.5,
    allStepsDone: false,
  });
  assert.equal(wouldCreateCycle("root", "leaf-b", nodes), true);
  assert.equal(wouldCreateCycle("leaf-b", "root", nodes), false);
  const index = buildProjectTreeIndex(nodes);
  assert.deepEqual(index.progressByNodeId.get("root"), { completed: 1, total: 2 });
  assert.deepEqual(index.childrenByParentId.get("root")?.map((item) => item.id), [
    "leaf-a",
    "branch",
  ]);
  assert.deepEqual([...index.leafIds].sort(), ["leaf-a", "leaf-b"]);
});

test("recommendation target remains on the Today date throughout the day", () => {
  assert.equal(
    recommendationTargetDate(new Date(2026, 6, 9, 2, 59, 59)).getDate(),
    9,
  );
  assert.equal(
    recommendationTargetDate(new Date(2026, 6, 9, 3, 0, 0)).getDate(),
    9,
  );
  assert.equal(
    recommendationTargetDate(new Date(2026, 6, 9, 3, 1, 0)).getDate(),
    9,
  );
});

test("deadline tasks expose both desired completion and actual deadline occurrences", () => {
  const task = plannerTask({
    id: "deadline-anchors",
    title: "Submit paper",
    taskKind: "assignment",
    desiredCompletionAt: new Date(2026, 7, 25, 17, 0).toISOString(),
    actualDeadlineAt: new Date(2026, 7, 28, 23, 0).toISOString(),
  });

  assert.deepEqual(
    taskOccurrencesOnDay(task, new Date(2026, 7, 25, 12)).map(({ anchor }) => anchor.kind),
    ["desired"],
  );
  assert.deepEqual(
    taskOccurrencesOnDay(task, new Date(2026, 7, 28, 12)).map(({ anchor }) => anchor.kind),
    ["deadline"],
  );
});

test("deadline tasks collapse overlapping milestones into one calendar occurrence", () => {
  const sharedDeadline = new Date(2026, 7, 28, 18, 0).toISOString();
  const task = plannerTask({
    id: "overlapping-deadline-anchors",
    title: "Submit paper",
    taskKind: "assignment",
    scheduledStartAt: sharedDeadline,
    desiredCompletionAt: new Date(2026, 7, 28, 17, 0).toISOString(),
    actualDeadlineAt: sharedDeadline,
  });

  assert.deepEqual(
    taskOccurrencesOnDay(task, new Date(2026, 7, 28, 12)).map(({ anchor }) => anchor.kind),
    ["scheduled"],
  );
});

test("free time ignores 19 minutes, keeps 20 minutes, and supports next-day sleep", () => {
  const target = new Date(2026, 6, 9, 12);
  const events = [
    {
      id: "event-a",
      entityType: "event",
      startAt: new Date(2026, 6, 9, 8, 0).toISOString(),
      endAt: new Date(2026, 6, 9, 9, 0).toISOString(),
      status: "open",
      recurrenceRule: null,
    },
    {
      id: "event-b",
      entityType: "event",
      startAt: new Date(2026, 6, 9, 9, 19).toISOString(),
      endAt: new Date(2026, 6, 9, 10, 0).toISOString(),
      status: "open",
      recurrenceRule: null,
    },
    {
      id: "event-c",
      entityType: "event",
      startAt: new Date(2026, 6, 9, 10, 20).toISOString(),
      endAt: new Date(2026, 6, 10, 0, 10).toISOString(),
      status: "open",
      recurrenceRule: null,
    },
  ] as CalendarEvent[];
  const gaps = freeTimeRanges(target, "08:00", "00:30", events, [], [], 20);
  assert.deepEqual(
    gaps.map((gap) => Math.round(gap.minutes)),
    [20, 20],
  );
});

test("an open all-day task consumes the day while a completed occurrence does not", () => {
  const target = new Date(2026, 6, 9, 12);
  const allDayTask = plannerTask({
    id: "all-day-task",
    title: "Concert day",
    dueAt: "2026-07-09T23:59:00+08:00",
    isAllDay: true,
  });

  assert.deepEqual(
    freeTimeRanges(target, "08:00", "23:00", [], [], [allDayTask], 20),
    [],
  );
  assert.ok(
    freeTimeRanges(
      target,
      "08:00",
      "23:00",
      [],
      [],
      [{ ...allDayTask, completedOccurrenceKeys: ["2026-07-09"] }],
      20,
    ).length > 0,
  );
});

test("a scheduled task without duration remains a time point", () => {
  const target = new Date(2026, 6, 9, 12);
  const timePoint = plannerTask({
    id: "time-point",
    title: "Submit form",
    scheduledStartAt: new Date(2026, 6, 9, 12).toISOString(),
    durationMinutes: null,
  });
  const gaps = freeTimeRanges(target, "08:00", "23:00", [], [], [timePoint], 20);

  assert.deepEqual(gaps.map((gap) => Math.round(gap.minutes)), [900]);
});

test("advance candidates include date-only tasks but exclude all-day tasks", () => {
  const dueAt = "2026-07-09T23:59:00+08:00";
  const candidates = buildAdvanceCandidates({
    tasks: [
      plannerTask({ id: "date-only", title: "Buy an outlet", dueAt }),
      plannerTask({ id: "all-day", title: "Concert day", dueAt, isAllDay: true }),
    ],
    projectNodes: [],
    projects: [],
    goals: [],
    scheduleBlocks: [],
    targetDate: new Date(2026, 6, 9, 12),
    now: new Date(2026, 6, 9, 8),
  });

  assert.deepEqual(candidates.map((candidate) => candidate.id), ["date-only"]);
});

test("project nodes become advance candidates only after being focused", () => {
  const time = "2026-07-09T00:00:00.000Z";
  const focused = node("focused", null, "open", time);
  focused.isFocused = true;
  const candidates = buildAdvanceCandidates({
    tasks: [],
    projectNodes: [focused, node("not-focused", null, "open", time)],
    projects: [{
      id: "project-1",
      entityType: "project",
      goalId: "goal-1",
      title: "Opt-in project",
      status: "active",
      initializationState: "ready",
      order: 0,
      sourceThoughtIds: [],
      createdAt: time,
      updatedAt: time,
      version: 1,
    }],
    goals: [],
    scheduleBlocks: [],
    targetDate: new Date(2026, 6, 9, 12),
    now: new Date(2026, 6, 9, 8),
  });

  assert.deepEqual(candidates.map((candidate) => candidate.id), ["focused"]);
});

test("recommendation count is determined by the longest continuous gap", () => {
  assert.equal(recommendationLimit([]), 0);
  assert.equal(recommendationLimit([{ startAt: "", endAt: "", minutes: 19 }]), 0);
  assert.equal(recommendationLimit([{ startAt: "", endAt: "", minutes: 20 }]), 1);
  assert.equal(recommendationLimit([{ startAt: "", endAt: "", minutes: 60 }]), 2);
  assert.equal(recommendationLimit([{ startAt: "", endAt: "", minutes: 120 }]), 3);
});

test("gap recommendations distinguish fragment, ordinary, and continuous work", () => {
  const time = "2026-07-29T00:00:00.000Z";
  const fragment = node("fragment", null, "open", time);
  fragment.isFragmentFriendly = true;
  const ordinary = node("ordinary", null, "open", time);
  const continuous = node("continuous", null, "open", time);
  continuous.needsContinuousTime = true;
  const candidates: AdvanceCandidate[] = [
    { id: "ordinary", title: "普通", caption: "", source: ordinary, needsContinuousTime: false, isFragmentFriendly: false, score: 0, startsLater: false },
    { id: "continuous", title: "连续", caption: "", source: continuous, needsContinuousTime: true, isFragmentFriendly: false, score: 0, startsLater: false },
    { id: "fragment", title: "碎片", caption: "", source: fragment, needsContinuousTime: false, isFragmentFriendly: true, score: 0, startsLater: false },
  ];
  assert.deepEqual(
    recommendCandidatesForGaps(candidates, [{ startAt: "", endAt: "", minutes: 30 }]).map((item) => item.id),
    ["fragment"],
  );
  assert.equal(
    recommendCandidatesForGaps(candidates, [{ startAt: "", endAt: "", minutes: 120 }])[0]?.id,
    "continuous",
  );
});

test("legacy fragment activity buckets migrate to exact time choices", () => {
  assert.deepEqual(normalizeFragmentMinutes(undefined, "10"), [15]);
  assert.deepEqual(normalizeFragmentMinutes(undefined, "30"), [30]);
  assert.deepEqual(normalizeFragmentMinutes(undefined, "60"), [60]);
  assert.deepEqual(normalizeFragmentMinutes(undefined, "long"), [90]);
  assert.deepEqual(normalizeFragmentMinutes([90, 15, 15, 42]), [15, 90]);
});

function node(
  id: string,
  parentId: string | null,
  status: ProjectNode["status"],
  time: string,
): ProjectNode {
  return {
    id,
    entityType: "projectNode",
    projectId: "project-1",
    parentId,
    title: id,
    order: 0,
    status,
    isFocused: false,
    needsContinuousTime: false,
    isFragmentFriendly: false,
    sourceThoughtIds: [],
    completedAt: status === "completed" ? time : null,
    createdAt: time,
    updatedAt: time,
    version: 1,
  };
}

function plannerTask(overrides: Partial<PlannerTask> = {}): PlannerTask {
  const time = "2026-07-09T00:00:00.000Z";
  return {
    id: "task-1",
    entityType: "task",
    planningState: "planned",
    taskKind: "ordinary",
    title: "Task",
    notes: "",
    itemTypeId: "temporary",
    status: "open",
    scheduledStartAt: null,
    recurrenceRule: null,
    reminderRules: [],
    completedOccurrenceKeys: [],
    originThoughtIds: [],
    createdAt: time,
    updatedAt: time,
    version: 1,
    ...overrides,
  };
}
