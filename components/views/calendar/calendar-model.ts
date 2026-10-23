import type { DragEvent } from "react";
import {
  expandRecurrence,
  formatTime,
  localDateKey,
  startOfLocalDay,
  taskDateAnchors,
  isExamItem,
  EXAM_TITLE_PATTERN,
  type CalendarEvent,
  type Goal,
  type ItemTypeOption,
  type PlannerTask,
  type Project,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import {
  compactTimelineY,
  type CompactTimelineScale,
} from "@/lib/planning";

export type DragPayload = {
  kind: "block" | "event" | "task" | "node" | "thought";
  id: string;
};

export type CalendarEntry =
  | { kind: "task"; item: PlannerTask; at: string; endAt: string; color: string; instanceKey: string; occurrenceAt?: string; timingLabel?: string }
  | { kind: "event"; item: CalendarEvent; at: string; endAt: string; color: string; instanceKey: string }
  | { kind: "block"; item: ScheduleBlock; at: string; endAt: string; color: string; instanceKey: string };

// Keep the week compact: one minute per pixel, with title and time only.
export const TWO_HOUR_HEIGHT = 120;
export const TIMELINE_PADDING = 10;
// Point-only entries have a small visual marker, not an invented duration.
export const CALENDAR_ENTRY_MIN_HEIGHT = 32;

export function fittedCalendarHourScale(start: number, end: number, availableHeight: number | null) {
  if (availableHeight === null) return TWO_HOUR_HEIGHT;
  // Reserve room for a point-only item at the very end of the display window.
  const plotHeight = Math.max(1, availableHeight - TIMELINE_PADDING * 2 - CALENDAR_ENTRY_MIN_HEIGHT);
  return plotHeight * 120 / Math.max(120, end - start);
}

export function taskBelongsToCourseOccurrence(
  task: PlannerTask,
  eventId: string,
  occurrenceDate: string,
) {
  if (
    task.courseEventId !== eventId ||
    task.courseOccurrenceDate !== occurrenceDate
  ) {
    return false;
  }
  return !task.scheduledStartAt ||
    localDateKey(new Date(task.scheduledStartAt)) === occurrenceDate;
}

function calendarEntryLanePriority(entry: CalendarEntry) {
  if (entry.kind === "event" && entry.item.eventKind === "course") return 0;
  if (entry.kind === "task" && entry.item.courseEventId) return 2;
  return 1;
}

export interface CalendarCommonProps {
  tasks: PlannerTask[];
  events: CalendarEvent[];
  blocks: ScheduleBlock[];
  nodes: ProjectNode[];
  goals: Goal[];
  projects: Project[];
  itemTypes?: ItemTypeOption[];
  displayStart: string;
  displayEnd: string;
  itemColor: (item: PlannerTask | CalendarEvent) => string;
  nodeColor: (node: ProjectNode) => string;
  onTask: (task: PlannerTask, occurrenceAt?: string) => void;
  onTaskComplete: (task: PlannerTask, occurrenceAt?: string) => void;
  onEvent: (event: CalendarEvent, occurrenceAt: string) => void;
  onCourseTasks: (event: CalendarEvent, occurrenceAt: string, occurrenceEndAt: string) => void;
  onCourseDrop: (
    payload: DragPayload,
    event: CalendarEvent,
    occurrenceAt: string,
    occurrenceEndAt: string,
  ) => Promise<void>;
  onEventComplete: (event: CalendarEvent) => void;
  onBlock: (block: ScheduleBlock) => void;
  onBlockComplete: (block: ScheduleBlock) => void;
  onAdd: (date: Date, withTime?: boolean) => void;
  onQuickAdd: (date: Date) => void;
  onMove: (payload: DragPayload, date: Date, withTime: boolean) => Promise<void>;
  onSelectDay?: (date: Date) => void;
}

export interface CalendarEntryOptions {
  hideCourses?: boolean;
}

export function entriesForDay(
  day: Date,
  props: CalendarCommonProps,
  options?: CalendarEntryOptions,
): CalendarEntry[] {
  return entriesForDays([day], props, options).get(day.getTime()) ?? [];
}

export function entriesForDays(
  days: Date[],
  props: CalendarCommonProps,
  options: CalendarEntryOptions = {},
): Map<number, CalendarEntry[]> {
  const entriesByDay = new Map(days.map((day) => [day.getTime(), [] as CalendarEntry[]]));
  if (!days.length) return entriesByDay;
  const dayTimeByKey = new Map(days.map((day) => [localDateKey(day), day.getTime()]));
  const blockSourceIdsByKey = new Map<string, Set<string>>();
  const nodesById = new Map(props.nodes.map((node) => [node.id, node]));

  for (const block of props.blocks) {
    if (block.status === "skipped") continue;
    const dayTime = dayTimeByKey.get(block.date);
    if (dayTime == null) continue;
    const sourceIds = blockSourceIdsByKey.get(block.date) ?? new Set<string>();
    sourceIds.add(block.sourceId);
    blockSourceIdsByKey.set(block.date, sourceIds);
    const node = nodesById.get(block.sourceId);
    entriesByDay.get(dayTime)!.push({
      kind: "block",
      item: block,
      at: block.startAt ?? "",
      endAt: block.endAt ?? "",
      color: node ? props.nodeColor(node) : "#AFC3D4",
      instanceKey: `block-${block.id}`,
    });
  }

  const rangeStart = startOfLocalDay(days[0]);
  const rangeEnd = startOfLocalDay(days.at(-1)!);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  rangeEnd.setMilliseconds(-1);
  const occurrencesFor = (
    direct: string | null | undefined,
    recurrenceRule: string | null | undefined,
  ) => {
    const byKey = new Map<string, string>();
    if (direct) {
      const key = localDateKey(new Date(direct));
      if (dayTimeByKey.has(key)) byKey.set(key, direct);
    }
    for (const occurrence of expandRecurrence(recurrenceRule, rangeStart, rangeEnd)) {
      const key = localDateKey(occurrence);
      if (dayTimeByKey.has(key) && !byKey.has(key)) byKey.set(key, occurrence.toISOString());
    }
    return byKey;
  };

  const courseOccurrenceKeys = new Set<string>();
  for (const event of props.events) {
    if (event.eventKind !== "course") continue;
    for (const key of occurrencesFor(event.startAt, event.recurrenceRule).keys()) {
      if ((event.excludedOccurrenceKeys ?? []).includes(key)) continue;
      courseOccurrenceKeys.add(event.id + ":" + key);
    }
  }

  for (const task of props.tasks) {
    if (task.planningState === "draft") continue;
    for (const anchor of taskDateAnchors(task)) {
      const occurrences = occurrencesFor(anchor.at, anchor.recurring ? task.recurrenceRule : null);
      for (const [key, occurrence] of occurrences) {
        const isPrimary = anchor.kind === "scheduled" || anchor.kind === "due";
        if (isPrimary && blockSourceIdsByKey.get(key)?.has(task.id)) continue;
        if (
          !options.hideCourses &&
          isPrimary &&
          task.courseEventId &&
          courseOccurrenceKeys.has(task.courseEventId + ":" + key) &&
          taskBelongsToCourseOccurrence(task, task.courseEventId, key)
        ) {
          continue;
        }
        const dayTime = dayTimeByKey.get(key)!;
        const at = anchor.timed ? occurrence : "";
        entriesByDay.get(dayTime)!.push({
          kind: "task",
          item: task,
          occurrenceAt: occurrence,
          at,
          endAt: at && anchor.usesDuration && task.durationMinutes
            ? new Date(new Date(at).getTime() + task.durationMinutes * 60_000).toISOString()
            : at,
          color: props.itemColor(task),
          instanceKey: `task-${task.id}-${anchor.kind}-${occurrence}`,
          timingLabel: anchor.kind === "desired"
            ? "预期完成"
            : anchor.kind === "deadline"
              ? "实际截止"
              : undefined,
        });
      }
    }
  }

  for (const event of props.events) {
    if (options.hideCourses && event.eventKind === "course" && !isExamItem(event, props.itemTypes)) continue;
    const occurrences = occurrencesFor(event.startAt, event.recurrenceRule);
    const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
    for (const [key, occurrence] of occurrences) {
      if ((event.excludedOccurrenceKeys ?? []).includes(key)) continue;
      const dayTime = dayTimeByKey.get(key)!;
      entriesByDay.get(dayTime)!.push({
        kind: "event",
        item: event,
        at: occurrence,
        endAt: new Date(new Date(occurrence).getTime() + duration).toISOString(),
        color: props.itemColor(event),
        instanceKey: `event-${event.id}-${occurrence}`,
      });
    }
  }

  for (const entries of entriesByDay.values()) {
    entries.sort((a, b) => a.at.localeCompare(b.at));
  }
  return entriesByDay;
}

export function positionEntries(
  entries: CalendarEntry[],
  scale: CompactTimelineScale,
  configuredStart: number,
  configuredEnd: number,
) {
  const prepared = entries.map((entry) => {
    const start = new Date(entry.at);
    const end = entry.endAt ? new Date(entry.endAt) : new Date(start.getTime() + 45 * 60_000);
    const startMinutes = displayClockMinutes(start, configuredStart, configuredEnd);
    const endMinutes = Math.max(
      startMinutes + 1,
      startMinutes + (end.getTime() - start.getTime()) / 60_000,
    );
    const top = TIMELINE_PADDING + compactTimelineY(startMinutes, scale);
    const naturalHeight = compactTimelineY(endMinutes, scale) - compactTimelineY(startMinutes, scale);

    return {
      entry,
      startMinutes,
      endMinutes,
      top,
      height: end.getTime() > start.getTime() ? Math.max(1, naturalHeight) : CALENDAR_ENTRY_MIN_HEIGHT,
    };
  });
  prepared.sort(
    (left, right) =>
      left.startMinutes - right.startMinutes ||
      calendarEntryLanePriority(left.entry) - calendarEntryLanePriority(right.entry),
  );

  const positioned: Array<{
    entry: CalendarEntry;
    lane: number;
    lanes: number;
    top: number;
    height: number;
  }> = [];
  let cluster: typeof prepared = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flushCluster = () => {
    if (!cluster.length) return;
    // Only real time intersections create parallel lanes.
    const laneEnds: number[] = [];
    const clustered = cluster.map((item) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.startMinutes);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[lane] = item.endMinutes;
      }
      return { ...item, lane };
    });
    const lanes = Math.max(1, laneEnds.length);
    for (const item of clustered) {
      positioned.push({
        entry: item.entry,
        lane: item.lane,
        lanes,
        top: item.top,
        height: item.height,
      });
    }
  };

  for (const item of prepared) {
    if (cluster.length && item.startMinutes >= clusterEnd) {
      flushCluster();
      cluster = [];
      clusterEnd = Number.NEGATIVE_INFINITY;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMinutes);
  }
  flushCluster();
  // Minimum-height labels must not cover the next item when the axis is fitted.
  // Keep exact start positions and real overlap lanes; only trim excess paint.
  for (let index = 0; index < positioned.length; index++) {
    const current = positioned[index];
    const left = current.lane / current.lanes;
    const right = (current.lane + 1) / current.lanes;
    const next = positioned.slice(index + 1).find((candidate) =>
      candidate.top > current.top &&
      candidate.lane / candidate.lanes < right &&
      (candidate.lane + 1) / candidate.lanes > left,
    );
    if (next) current.height = Math.min(current.height, Math.max(1, next.top - current.top - 1));
  }
  return positioned;
}

export function isAllDayEntry(entry: CalendarEntry) {
  return !entry.at && entry.kind === "task" && entry.item.isAllDay === true;
}

export function parseClockMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 8) * 60 +
    (Number.isFinite(minutes) ? minutes : 0);
}

export function displayClockMinutes(
  value: Date,
  configuredStart: number,
  configuredEnd: number,
): number {
  let minutes = value.getHours() * 60 + value.getMinutes();
  if (
    configuredEnd > 24 * 60 &&
    minutes <= configuredEnd - 24 * 60 &&
    minutes < configuredStart
  ) {
    minutes += 24 * 60;
  }
  return minutes;
}

export function formatClockMarker(minutes: number): string {
  if (minutes === 24 * 60) return "24:00";
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const timeStr = `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  if (minutes > 24 * 60) {
    return `${timeStr}⁺¹`;
  }
  return timeStr;
}

export function taskTimingSummary(item: PlannerTask): string {
  if (item.scheduledStartAt) {
    const start = formatTime(item.scheduledStartAt);
    const end = item.durationMinutes
      ? formatTime(
          new Date(
            new Date(item.scheduledStartAt).getTime() + item.durationMinutes * 60_000,
          ).toISOString(),
        )
      : "";
    return end ? `${start}-${end}` : start;
  }
  if (item.dueAt) return `截止 ${formatTime(item.dueAt)}`;
  return "待安排";
}

export function setDragPayload(event: DragEvent, payload: DragPayload) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/planner-item", JSON.stringify(payload));
}

export function readDragPayload(event: DragEvent): DragPayload | null {
  try {
    const payload = JSON.parse(
      event.dataTransfer.getData("application/planner-item"),
    ) as Partial<DragPayload>;
    const kinds: DragPayload["kind"][] = ["block", "event", "task", "node", "thought"];
    if (!payload.id || !kinds.includes(payload.kind as DragPayload["kind"])) return null;
    return { id: payload.id, kind: payload.kind as DragPayload["kind"] };
  } catch {
    return null;
  }
}

export async function handleDrop(
  event: DragEvent,
  day: Date,
  withTime: boolean,
  onMove: CalendarCommonProps["onMove"],
) {
  event.preventDefault();
  const payload = readDragPayload(event);
  if (payload) await onMove(payload, day, withTime);
}

export { EXAM_TITLE_PATTERN, isExamItem };

export function isExamEntry(entry: CalendarEntry, itemTypes?: ItemTypeOption[]): boolean {
  if (entry.kind === "block") {
    return false;
  }
  return isExamItem(entry.item, itemTypes);
}

export function dayHasExam(entries: CalendarEntry[], itemTypes?: ItemTypeOption[]): boolean {
  return entries.some((entry) => isExamEntry(entry, itemTypes));
}
