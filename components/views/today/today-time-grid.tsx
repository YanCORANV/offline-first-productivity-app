"use client";

import type { CSSProperties } from "react";
import { Check, Circle, X } from "lucide-react";
import {
  formatTime,
  isTaskOccurrenceCompleted,
  type CalendarEvent,
  type PlannerTask,
  type ScheduleBlock,
} from "@/lib/domain";
import {
  buildCompactTimelineScale,
  compactTimelineY,
  formatGapDuration,
  resolveTimelineWindow,
  timelineOffsetMinutes,
} from "@/lib/planning";

const HOUR_HEIGHT = 42;
const TIMELINE_PADDING = 12;
const MIN_MARKER_GAP_PX = 24;

export type TodayTimedEntry = {
  kind: "task" | "event" | "block";
  item: PlannerTask | CalendarEvent | ScheduleBlock;
  at: string;
  endAt: string;
  title: string;
  color: string;
  instanceKey?: string;
  timingLabel?: string;
};

export type TodayUntimedEntry =
  | { kind: "task"; item: PlannerTask; title: string; occurrenceAt?: string }
  | { kind: "block"; item: ScheduleBlock; title: string; occurrenceAt?: string };

export function TodayTimeGrid({
  entries,
  now,
  date,
  displayStart,
  displayEnd,
  onTask,
  onEvent,
  onBlock,
  onTaskComplete,
  onEventComplete,
  onBlockComplete,
}: {
  entries: TodayTimedEntry[];
  now: Date;
  date?: Date;
  displayStart: string;
  displayEnd: string;
  onTask: (task: PlannerTask) => void;
  onEvent: (event: CalendarEvent) => void;
  onBlock: (block: ScheduleBlock) => void;
  onTaskComplete: (task: PlannerTask, at: string) => void;
  onEventComplete: (event: CalendarEvent) => void;
  onBlockComplete: (block: ScheduleBlock) => void;
}) {
  const targetDate = date ?? now;
  const isToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();

  const timelineWindow = resolveTimelineWindow(
    targetDate,
    displayStart,
    displayEnd,
    entries.map((entry) => ({ startAt: entry.at, endAt: entry.endAt })),
  );
  const scale = buildCompactTimelineScale(
    0,
    timelineWindow.totalMinutes,
    entries.map((entry) => {
      const startMin = timelineOffsetMinutes(entry.at, timelineWindow);
      const endMin = timelineOffsetMinutes(entry.endAt, timelineWindow);
      return {
        startMinute: startMin,
        endMinute: Math.max(startMin + 35, endMin),
      };
    }),
    HOUR_HEIGHT,
  );
  const height = Math.max(130, scale.height + TIMELINE_PADDING * 2);
  const currentMinute = isToday ? timelineOffsetMinutes(now, timelineWindow) : -1;
  const currentTop = TIMELINE_PADDING + compactTimelineY(currentMinute, scale);
  const positionedEntries = positionTodayEntries(entries);

  // Collect entry start times as candidate markers (deduplicated)
  const candidateTimes = Array.from(
    new Map(
      entries.map((entry) => {
        const d = new Date(entry.at);
        return [d.getTime(), d];
      }),
    ).values(),
  ).sort((a, b) => a.getTime() - b.getTime());

  // Filter markers to guarantee no vertical overlapping
  let lastMarkerY = -Infinity;
  const filteredMarkers: Array<{ time: Date; top: number }> = [];
  for (const marker of candidateTimes) {
    const minute = timelineOffsetMinutes(marker, timelineWindow);
    const top = Math.min(height - 1, TIMELINE_PADDING + compactTimelineY(minute, scale));
    if (top - lastMarkerY >= MIN_MARKER_GAP_PX) {
      filteredMarkers.push({ time: marker, top });
      lastMarkerY = top;
    }
  }

  return (
    <div className="today-spatial-timeline" style={{ height }}>
      {filteredMarkers.map(({ time: marker, top }) => (
        <div
          className="today-time-marker"
          key={marker.getTime()}
          style={{ top }}
        >
          <time>{formatTime(marker.toISOString())}</time><span />
        </div>
      ))}
      {scale.segments.filter((segment) => segment.isGap && segment.endMinute - segment.startMinute > 20).map((segment) => (
        <div className="timeline-gap-label" key={`${segment.startMinute}-${segment.endMinute}`} style={{ top: TIMELINE_PADDING + segment.top, height: segment.height }}>
          <span>{formatGapDuration(segment.endMinute - segment.startMinute)}</span>
        </div>
      ))}
      {isToday && currentMinute >= 0 && currentMinute <= scale.endMinute ? (
        <span className="today-current-line" style={{ top: currentTop }} />
      ) : null}
      <div className="today-event-layer">
        {positionedEntries.map(({ entry, lane, lanes }) => {
          const startMinute = timelineOffsetMinutes(entry.at, timelineWindow);
          const endMinute = timelineOffsetMinutes(entry.endAt, timelineWindow);
          const top = TIMELINE_PADDING + compactTimelineY(startMinute, scale);
          const rawHeight = Math.max(34, compactTimelineY(endMinute, scale) - compactTimelineY(startMinute, scale));

          // Ensure card height never extends past the next card starting in the same lane
          const nextInLane = positionedEntries.find(
            (other) =>
              other.lane === lane &&
              other.entry !== entry &&
              timelineOffsetMinutes(other.entry.at, timelineWindow) > startMinute,
          );
          const maxAllowed = nextInLane
            ? Math.max(
                32,
                TIMELINE_PADDING +
                  compactTimelineY(timelineOffsetMinutes(nextInLane.entry.at, timelineWindow), scale) -
                  top -
                  3,
              )
            : Infinity;
          const entryHeight = Math.max(32, Math.min(rawHeight, maxAllowed));
          const isCompact = entryHeight < 50;
          const completed = entry.kind === "task"
            ? (entry.item as PlannerTask).status === "completed" ||
              Boolean(
                (entry.item as PlannerTask).recurrenceRule &&
                  entry.at &&
                  isTaskOccurrenceCompleted(entry.item as PlannerTask, entry.at),
              )
            : entry.kind === "event"
              ? entry.item.status === "completed"
              : entry.item.status === "performed";
          const failed = entry.kind === "task" && entry.item.status === "failed";
          const event = entry.kind === "event" ? entry.item as CalendarEvent : null;
          const isCourse = event?.eventKind === "course";
          const eventLocation = event?.location ?? null;
          return (
            <article
              className={`today-time-item ${isCompact ? "is-compact" : ""} ${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`}
              key={entry.instanceKey ?? `${entry.kind}-${entry.item.id}`}
              style={{ "--item-color": entry.color, top, height: entryHeight, left: `${lane / lanes * 100}%`, width: `calc(${100 / lanes}% - 3px)` } as CSSProperties}
            >
              {!isCourse ? (
                <button className="item-inline-check" type="button" onClick={() => {
                  if (entry.kind === "task") onTaskComplete(entry.item as PlannerTask, entry.at);
                  else if (entry.kind === "event") onEventComplete(entry.item as CalendarEvent);
                  else onBlockComplete(entry.item as ScheduleBlock);
                }}>
                  {failed ? <X size={12} /> : completed ? <Check size={12} /> : <Circle size={13} />}
                </button>
              ) : null}
              <button type="button" onClick={() => {
                if (entry.kind === "task") onTask(entry.item as PlannerTask);
                else if (entry.kind === "event") onEvent(entry.item as CalendarEvent);
                else onBlock(entry.item as ScheduleBlock);
              }}>
                <time>
                  {formatTime(entry.at)}
                  {entry.endAt !== entry.at ? `–${formatTime(entry.endAt)}` : ""}
                </time>
                <strong>{entry.title}</strong>
                {entry.timingLabel ? <small>{entry.timingLabel}</small> : eventLocation ? <small>{eventLocation}</small> : null}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function positionTodayEntries<T extends { at: string; endAt: string }>(entries: T[]) {
  const sorted = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const result: Array<{ entry: T; lane: number; lanes: number }> = [];
  let group: Array<{ entry: T; lane: number }> = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    result.push(...group.map((item) => ({ ...item, lanes })));
    group = [];
    laneEnds = [];
    groupEnd = -Infinity;
  };
  for (const entry of sorted) {
    const start = new Date(entry.at).getTime();
    const end = Math.max(
      start + 20 * 60_000,
      new Date(entry.endAt).getTime(),
    );
    if (group.length && start >= groupEnd) flush();
    const availableLane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = end;
    groupEnd = Math.max(groupEnd, end);
    group.push({ entry, lane });
  }
  if (group.length) flush();
  return result;
}

export function TodayUntimedItem({ entry, onTask, onBlock, onTaskComplete, onBlockComplete }: {
  entry: TodayUntimedEntry;
  onTask: (task: PlannerTask, occurrenceAt?: string) => void;
  onBlock: (block: ScheduleBlock) => void;
  onTaskComplete: (task: PlannerTask, occurrenceAt?: string) => void;
  onBlockComplete: (block: ScheduleBlock) => void;
}) {
  const completed = entry.kind === "task"
    ? entry.item.status === "completed" ||
      Boolean(
        entry.item.recurrenceRule &&
          entry.occurrenceAt &&
          isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt),
      )
    : entry.item.status === "performed";
  const failed = entry.kind === "task" && entry.item.status === "failed";
  return (
    <article className={`${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`}>
      <button
        className="item-inline-check"
        type="button"
        aria-label={completed ? `标记未完成 ${entry.title}` : `标记完成 ${entry.title}`}
        onClick={() => entry.kind === "task" ? onTaskComplete(entry.item, entry.occurrenceAt) : onBlockComplete(entry.item)}
      >
        {failed ? <X size={12} /> : completed ? <Check size={12} /> : <Circle size={13} />}
      </button>
      <button
        type="button"
        onClick={() => entry.kind === "task" ? onTask(entry.item, entry.occurrenceAt) : onBlock(entry.item)}
      >
        {entry.title}
      </button>
    </article>
  );
}
