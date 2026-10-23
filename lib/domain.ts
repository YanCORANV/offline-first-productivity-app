import * as rruleModule from "rrule";

const rruleRuntime = (Reflect.get(rruleModule, "default") ?? rruleModule) as typeof import("rrule");
const { RRule, rrulestr } = rruleRuntime;

export type ThoughtStatus = "inbox" | "someday" | "archived" | "deleted";
export type TaskStatus = "open" | "completed" | "failed" | "deleted";
export type PlanningState = "draft" | "planned";
export type ProjectStatus = "active" | "paused" | "completed" | "abandoned";
export type ProjectInitializationState = "draft" | "ready";
export type AssignmentStatus = "todo" | "content_done" | "submitted";
export type FragmentMinutes = 15 | 30 | 60 | 90;
export type EventKind = "event" | "course" | "exam";

export interface ItemTypeOption {
  id: string;
  name: string;
  color: string;
}

export const MORANDI_COLORS = [
  "#AFC3D4",
  "#D7A6A1",
  "#D8C39F",
  "#AFC4B1",
  "#B9B2CC",
  "#A9C4C0",
  "#C9B9A9",
  "#C6C1BA",
] as const;

export const DEFAULT_ITEM_TYPES: ItemTypeOption[] = [
  { id: "research", name: "科研", color: MORANDI_COLORS[0] },
  { id: "deadline", name: "Deadline", color: MORANDI_COLORS[1] },
  { id: "temporary", name: "临时", color: MORANDI_COLORS[2] },
  { id: "music", name: "音乐", color: MORANDI_COLORS[4] },
  { id: "course", name: "课程", color: MORANDI_COLORS[3] },
];

export function normalizeItemTypes(
  itemTypes?: ItemTypeOption[] | null,
): ItemTypeOption[] {
  const current = itemTypes ?? [];
  const builtIns = DEFAULT_ITEM_TYPES.map(
    (fallback) => current.find((item) => item.id === fallback.id) ?? fallback,
  );
  return [
    ...builtIns,
    ...current.filter(
      (item) => !DEFAULT_ITEM_TYPES.some((fallback) => fallback.id === item.id),
    ),
  ];
}

export const EXAM_TITLE_PATTERN =
  /考试|期[中末]考|[月段小]考|补考|重考|会考|高考|中考|统考|联考|测验|\bexam\b|\bquiz\b|\bmidterm\b|\bfinal\b|\btest\b/i;

export function isExamItem(
  item: { title?: string; eventKind?: EventKind; itemTypeId?: string | null },
  itemTypes?: ItemTypeOption[],
): boolean {
  if (item.eventKind === "exam") return true;
  if (item.title && EXAM_TITLE_PATTERN.test(item.title)) return true;
  if (item.itemTypeId && itemTypes) {
    const type = itemTypes.find((t) => t.id === item.itemTypeId);
    if (type) {
      if (EXAM_TITLE_PATTERN.test(type.name)) return true;
      if (/exam|quiz|test/i.test(type.id)) return true;
    }
  }
  return false;
}

export interface ReminderRule {
  id: string;
  offsetMinutes: number;
  anchor: "start" | "end" | "desired" | "deadline";
}
export type SuggestionType =
  | "task"
  | "event"
  | "someday"
  | "discuss"
  | "archive"
  | "ignore";

export interface VersionedEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export interface QuickThought extends VersionedEntity {
  entityType: "thought";
  content: string;
  status: ThoughtStatus;
  capturedTimezone: string;
  processedAt?: string | null;
  resultLabel?: string | null;
}

export interface PlannerTask extends VersionedEntity {
  entityType: "task";
  planningState: PlanningState;
  taskKind: "ordinary" | "assignment";
  title: string;
  notes: string;
  itemTypeId: string;
  colorOverride?: string | null;
  status: TaskStatus;
  dueAt?: string | null;
  scheduledStartAt?: string | null;
  durationMinutes?: number | null;
  isAllDay?: boolean;
  recurrenceRule?: string | null;
  reminderOffsetMinutes?: number | null;
  reminderRules: ReminderRule[];
  assignmentStatus?: AssignmentStatus | null;
  desiredCompletionAt?: string | null;
  actualDeadlineAt?: string | null;
  courseEventId?: string | null;
  courseOccurrenceDate?: string | null;
  needsContinuousTime: boolean;
  isFragmentFriendly: boolean;
  completedAt?: string | null;
  completedOccurrenceKeys: string[];
  originThoughtIds: string[];
}

export interface CalendarEvent extends VersionedEntity {
  entityType: "event";
  eventKind: EventKind;
  title: string;
  location?: string | null;
  notes: string;
  status: "open" | "completed";
  completedAt?: string | null;
  itemTypeId: string;
  colorOverride?: string | null;
  startAt: string;
  endAt: string;
  recurrenceRule?: string | null;
  excludedOccurrenceKeys?: string[];
  reminderOffsetMinutes?: number | null;
  reminderRules: ReminderRule[];
  recurrenceEndAt?: string | null;
  timezone: string;
  originThoughtIds: string[];
}

export interface Goal extends VersionedEntity {
  entityType: "goal";
  name: string;
  color: string;
  order: number;
  archived: boolean;
}

export interface Project extends VersionedEntity {
  entityType: "project";
  goalId: string;
  title: string;
  status: ProjectStatus;
  initializationState: ProjectInitializationState;
  order: number;
  sourceThoughtIds: string[];
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  importCheckpoint?: {
    status: "running" | "complete" | "failed";
    processed: number;
    total: number;
    candidates: Array<{
      title: string;
      depth: number;
      parentIndex: number | null;
    }>;
    error?: string | null;
  } | null;
}

export interface ProjectNode extends VersionedEntity {
  entityType: "projectNode";
  projectId: string;
  parentId: string | null;
  title: string;
  order: number;
  status: "open" | "completed";
  isFocused: boolean;
  needsContinuousTime: boolean;
  isFragmentFriendly: boolean;
  sourceThoughtIds: string[];
  importIndex?: number | null;
  completedAt?: string | null;
}

export interface ScheduleBlock extends VersionedEntity {
  entityType: "scheduleBlock";
  sourceType: "task" | "projectNode";
  sourceId: string;
  date: string;
  startAt?: string | null;
  endAt?: string | null;
  status: "planned" | "performed" | "skipped";
  reminderRules: ReminderRule[];
}

export interface FragmentActivity extends VersionedEntity {
  entityType: "fragmentActivity";
  title: string;
  eligibleMinutes: FragmentMinutes[];
  enabled: boolean;
}

export function normalizeFragmentMinutes(
  eligibleMinutes: unknown,
  legacyBucket?: unknown,
): FragmentMinutes[] {
  if (Array.isArray(eligibleMinutes)) {
    const normalized = [...new Set(
      eligibleMinutes
        .map(Number)
        .filter((value): value is FragmentMinutes =>
          value === 15 || value === 30 || value === 60 || value === 90,
        ),
    )].sort((a, b) => a - b);
    if (normalized.length) return normalized;
  }
  if (legacyBucket === "10") return [15];
  if (legacyBucket === "30") return [30];
  if (legacyBucket === "60") return [60];
  return [90];
}

export interface MissedNotification extends VersionedEntity {
  entityType: "notification";
  title: string;
  body: string;
  targetUrl: string;
  readAt?: string | null;
}

export interface OriginLink extends VersionedEntity {
  entityType: "originLink";
  sourceEntityType: "thought" | "outline";
  sourceEntityId: string;
  targetEntityType: "task" | "event" | "goal" | "project" | "projectNode";
  targetEntityId: string;
  relationship: "created_from" | "imported_from";
}

export interface MemoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const DEFAULT_MEMO_ITEMS: MemoItem[] = [
  { id: "memo-1790409486818-m75m", text: "github项目", completed: false },
];

export interface PlannerSettings {
  id: "main";
  version: number;
  timezone: string;
  defaultWakeTime: string;
  defaultSleepTime: string;
  calendarDisplayStart: string;
  calendarDisplayEnd: string;
  sleepOverrides: Record<string, string>;
  inboxAgeHours: number;
  cloudCursor: number;
  notificationState: NotificationPermission | "unsupported" | "unknown";
  itemTypes: ItemTypeOption[];
  currentGoalId?: string | null;
  lastProjectByGoal: Record<string, string>;
  lastTimezonePrompt?: string | null;
  memoItems?: MemoItem[];
}

export interface AiSuggestion {
  id: string;
  type: SuggestionType;
  thoughtIds: string[];
  title: string;
  rationale: string;
  nextAction?: string | null;
  scheduledStartAt?: string | null;
  dueAt?: string | null;
  durationMinutes?: number | null;
  status: "pending" | "accepted" | "rejected";
}

export interface AiRun extends VersionedEntity {
  entityType: "aiRun";
  thoughtIds: string[];
  provider: string;
  model: string;
  status: "running" | "ready" | "failed" | "confirmed";
  suggestions: AiSuggestion[];
  error?: string | null;
}

export type PlannerEntity =
  | QuickThought
  | PlannerTask
  | CalendarEvent
  | Goal
  | Project
  | ProjectNode
  | ScheduleBlock
  | FragmentActivity
  | MissedNotification
  | OriginLink
  | AiRun;
export type SyncEntityType = PlannerEntity["entityType"] | "settings" | "pushSubscription";

export interface SyncOperation {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  action: "upsert" | "delete";
  baseVersion: number;
  patch: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "syncing" | "conflict";
  error?: string | null;
  retryCount?: number;
}

export interface SyncConflict {
  id: string;
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  localPatch: Record<string, unknown>;
  serverRecord: Record<string, unknown>;
  conflictingFields: string[];
  createdAt: string;
}

export interface CloudChange {
  cursor: number;
  entityType: SyncEntityType;
  entityId: string;
  operation: "upsert" | "delete";
  record: Record<string, unknown>;
  version: number;
}

export const DEFAULT_SETTINGS: PlannerSettings = {
  id: "main",
  version: 0,
  timezone: "Asia/Shanghai",
  defaultWakeTime: "08:00",
  defaultSleepTime: "00:30",
  calendarDisplayStart: "08:00",
  calendarDisplayEnd: "02:00",
  sleepOverrides: {},
  inboxAgeHours: 48,
  cloudCursor: 0,
  notificationState: "unknown",
  itemTypes: DEFAULT_ITEM_TYPES,
  currentGoalId: null,
  lastProjectByGoal: {},
  memoItems: DEFAULT_MEMO_ITEMS,
};

export function newId(prefix = ""): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sameLocalDay(value: string | null | undefined, date: Date): boolean {
  if (!value) return false;
  return localDateKey(new Date(value)) === localDateKey(date);
}

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfWeek(date: Date): Date {
  const result = startOfLocalDay(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  return result;
}

export function daysFrom(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function computeReminderAt(
  anchor: string,
  offsetMinutes?: number | null,
): string | null {
  if (offsetMinutes == null) return null;
  return new Date(new Date(anchor).getTime() - offsetMinutes * 60_000).toISOString();
}

export function parseRepeatPreset(
  preset: "none" | "daily" | "weekdays" | "weekly" | "monthly",
  startAt?: string | null,
  recurrenceEndAt?: string | null,
): string | null {
  if (preset === "none" || !startAt) return null;
  const start = new Date(startAt);
  const localDay = (start.getDay() + 6) % 7;
  const utcDay = (start.getUTCDay() + 6) % 7;
  const dayShift = (utcDay - localDay + 7) % 7;
  const dayCodes = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    dtstart: start,
  };
  if (recurrenceEndAt) {
    const until = new Date(`${recurrenceEndAt}T23:59:59`);
    if (!Number.isNaN(until.getTime())) options.until = until;
  }
  if (preset === "daily") options.freq = RRule.DAILY;
  if (preset === "weekdays") {
    options.freq = RRule.WEEKLY;
    options.byweekday = [0, 1, 2, 3, 4].map((day) => dayCodes[(day + dayShift) % 7]);
  }
  if (preset === "weekly") {
    options.freq = RRule.WEEKLY;
    options.byweekday = [dayCodes[(localDay + dayShift) % 7]];
  }
  if (preset === "monthly") {
    options.freq = RRule.MONTHLY;
    options.bymonthday = start.getDate();
  }
  return new RRule(options as ConstructorParameters<typeof RRule>[0]).toString();
}

export function courseWeekdayForDate(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

export function firstCourseDateOnOrAfter(
  startDate: string,
  weekdays: number[],
): string {
  if (!startDate || !weekdays.length) return startDate;
  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const startWeekday = (start.getDay() + 6) % 7;
  const offset = Math.min(
    ...weekdays.map((weekday) => (weekday - startWeekday + 7) % 7),
  );
  start.setDate(start.getDate() + offset);
  return localDateKey(start);
}

export function makeCustomRepeatRule(
  unit: "daily" | "weekly" | "monthly",
  interval: number,
  weekdays: number[],
  startAt?: string | null,
  recurrenceEndAt?: string | null,
): string | null {
  if (!startAt) return null;
  const startDate = new Date(startAt);
  const localDay = (startDate.getDay() + 6) % 7;
  const utcDay = (startDate.getUTCDay() + 6) % 7;
  const dayShift = (utcDay - localDay + 7) % 7;
  const dayCodes = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
  const options: ConstructorParameters<typeof RRule>[0] = {
    dtstart: startDate,
    freq: unit === "daily" ? RRule.DAILY : unit === "weekly" ? RRule.WEEKLY : RRule.MONTHLY,
    interval: Math.max(1, interval),
  };
  if (unit === "weekly" && weekdays.length) {
    options.byweekday = weekdays.map((day) => dayCodes[(day + dayShift) % 7]);
  }
  if (recurrenceEndAt) options.until = new Date(`${recurrenceEndAt}T23:59:59`);
  return new RRule(options).toString();
}

export function makeCourseRecurrenceRule(
  startAt: string | null | undefined,
  weekdays: number[],
  recurrenceEndAt?: string | null,
): string | null {
  if (!startAt || !weekdays.length) return null;
  const startDate = new Date(startAt);
  const localDay = (startDate.getDay() + 6) % 7;
  const utcDay = (startDate.getUTCDay() + 6) % 7;
  const dayShift = (utcDay - localDay + 7) % 7;
  const dayCodes = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
  const byweekday = [...new Set(weekdays)]
    .filter((weekday) => weekday >= 0 && weekday <= 6)
    .sort((a, b) => a - b)
    .map((weekday) => dayCodes[(weekday + dayShift) % 7]);
  if (!byweekday.length) return null;
  const options: ConstructorParameters<typeof RRule>[0] = {
    dtstart: startDate,
    freq: RRule.WEEKLY,
    byweekday,
  };
  if (recurrenceEndAt) options.until = new Date(`${recurrenceEndAt}T23:59:59`);
  return new RRule(options).toString();
}

function parseRecurrenceRule(rule: string): ReturnType<typeof rrulestr> {
  const parsed = rrulestr(rule);
  const dtstart = parsed.origOptions?.dtstart;
  if (dtstart && dtstart.getHours() === 23 && dtstart.getMinutes() === 59) {
    const fixed = new Date(dtstart);
    fixed.setHours(12, 0, 0, 0);
    return new RRule({ ...parsed.origOptions, dtstart: fixed });
  }
  return parsed;
}

export function recurrenceWeekdays(
  recurrenceRule: string | null | undefined,
  startAt?: string | null,
): number[] {
  if (!recurrenceRule) return [];
  try {
    const parsed = parseRecurrenceRule(recurrenceRule);
    const dayShift = startAt
      ? (() => {
          const startDate = new Date(startAt);
          const localDay = (startDate.getDay() + 6) % 7;
          const utcDay = (startDate.getUTCDay() + 6) % 7;
          return (utcDay - localDay + 7) % 7;
        })()
      : 0;
    return [...new Set(parsed.options.byweekday ?? [])]
      .filter((weekday) => weekday >= 0 && weekday <= 6)
      .map((weekday) => (weekday - dayShift + 7) % 7)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

const recurrenceRuleCache = new Map<string, ReturnType<typeof rrulestr>>();

export function expandRecurrence(
  recurrenceRule: string | null | undefined,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (!recurrenceRule) return [];
  try {
    let parsed = recurrenceRuleCache.get(recurrenceRule);
    if (!parsed) {
      parsed = parseRecurrenceRule(recurrenceRule);
      if (recurrenceRuleCache.size >= 256) {
        recurrenceRuleCache.delete(recurrenceRuleCache.keys().next().value!);
      }
      recurrenceRuleCache.set(recurrenceRule, parsed);
    }
    return parsed.between(rangeStart, rangeEnd, true);
  } catch {
    return [];
  }
}

export function recurrenceOnLocalDay(
  recurrenceRule: string | null | undefined,
  date: Date,
): Date | null {
  if (!recurrenceRule) return null;
  const start = startOfLocalDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return expandRecurrence(recurrenceRule, start, new Date(end.getTime() - 1))[0] ?? null;
}

export type TaskDateAnchorKind = "scheduled" | "desired" | "deadline" | "due";

export interface TaskDateAnchor {
  kind: TaskDateAnchorKind;
  at: string;
  timed: boolean;
  usesDuration: boolean;
  recurring: boolean;
}

export interface TaskDateOccurrence {
  anchor: TaskDateAnchor;
  occurrenceAt: string;
}

export function taskDateAnchors(task: PlannerTask): TaskDateAnchor[] {
  if (
    task.taskKind === "assignment" ||
    Boolean(task.actualDeadlineAt || task.desiredCompletionAt)
  ) {
    const anchors: TaskDateAnchor[] = [];
    const scheduledInstant = task.scheduledStartAt
      ? new Date(task.scheduledStartAt).getTime()
      : null;
    const duplicatesScheduled = (at: string) =>
      scheduledInstant !== null && new Date(at).getTime() === scheduledInstant;
    if (task.scheduledStartAt) {
      anchors.push({ kind: "scheduled", at: task.scheduledStartAt, timed: true, usesDuration: true, recurring: true });
    }
    if (
      task.desiredCompletionAt &&
      !duplicatesScheduled(task.desiredCompletionAt) &&
      (!task.actualDeadlineAt || !sameLocalDay(task.desiredCompletionAt, new Date(task.actualDeadlineAt)))
    ) {
      anchors.push({ kind: "desired", at: task.desiredCompletionAt, timed: true, usesDuration: false, recurring: false });
    }
    if (task.actualDeadlineAt && !duplicatesScheduled(task.actualDeadlineAt)) {
      anchors.push({ kind: "deadline", at: task.actualDeadlineAt, timed: true, usesDuration: false, recurring: false });
    }
    if (!anchors.length && task.dueAt) {
      anchors.push({ kind: "due", at: task.dueAt, timed: false, usesDuration: false, recurring: true });
    }
    return anchors;
  }
  const direct = task.scheduledStartAt ?? task.actualDeadlineAt ?? task.dueAt;
  if (!direct) return [];
  return [{
    kind: task.scheduledStartAt ? "scheduled" : task.actualDeadlineAt ? "deadline" : "due",
    at: direct,
    timed: Boolean(task.scheduledStartAt || task.actualDeadlineAt),
    usesDuration: Boolean(task.scheduledStartAt),
    recurring: true,
  }];
}

export function taskOccurrencesOnDay(task: PlannerTask, date: Date): TaskDateOccurrence[] {
  if (task.planningState === "draft") return [];
  return taskDateAnchors(task).flatMap((anchor) => {
    if (sameLocalDay(anchor.at, date)) return [{ anchor, occurrenceAt: anchor.at }];
    if (!anchor.recurring) return [];
    const occurrence = recurrenceOnLocalDay(task.recurrenceRule, date);
    return occurrence ? [{ anchor, occurrenceAt: occurrence.toISOString() }] : [];
  });
}

export function taskOccurrenceOnDay(task: PlannerTask, date: Date): string | null {
  return taskOccurrencesOnDay(task, date)[0]?.occurrenceAt ?? null;
}

export function eventOccurrenceOnDay(event: CalendarEvent, date: Date): string | null {
  if ((event.excludedOccurrenceKeys ?? []).includes(localDateKey(date))) return null;
  if (sameLocalDay(event.startAt, date)) return event.startAt;
  return recurrenceOnLocalDay(event.recurrenceRule, date)?.toISOString() ?? null;
}

export function isTaskOccurrenceCompleted(task: PlannerTask, occurrenceAt: string): boolean {
  return (task.completedOccurrenceKeys ?? []).includes(localDateKey(new Date(occurrenceAt)));
}

export function detectPatchConflict(
  patch: Record<string, unknown>,
  fieldsChangedSinceBase: string[],
): string[] {
  const remoteFields = new Set(fieldsChangedSinceBase);
  return Object.keys(patch).filter((field) => remoteFields.has(field));
}

export function mergeDisjointPatch<T extends Record<string, unknown>>(
  serverRecord: T,
  patch: Record<string, unknown>,
  fieldsChangedSinceBase: string[],
): { record: T; conflicts: string[] } {
  const conflicts = detectPatchConflict(patch, fieldsChangedSinceBase);
  if (conflicts.length) return { record: serverRecord, conflicts };
  return { record: { ...serverRecord, ...patch }, conflicts: [] };
}

export function formatTime(value?: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}
