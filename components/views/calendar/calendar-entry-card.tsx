import { useState, type CSSProperties } from "react";
import { Check, Circle, GripVertical, ListPlus, X } from "lucide-react";
import { formatTime, isTaskOccurrenceCompleted, localDateKey } from "@/lib/domain";
import { projectPath, taskTitleForBlock } from "@/lib/planning";
import {
  readDragPayload,
  setDragPayload,
  taskBelongsToCourseOccurrence,
  type CalendarCommonProps,
  type CalendarEntry,
} from "./calendar-model";

export function CalendarEntryCard({
  entry,
  compact = false,
  showTime = true,
  hideCourseLocation = false,
  summaryOnly = false,
  ...props
}: CalendarCommonProps & {
  entry: CalendarEntry;
  compact?: boolean;
  showTime?: boolean;
  hideCourseLocation?: boolean;
  summaryOnly?: boolean;
}) {
  const [courseDropActive, setCourseDropActive] = useState(false);
  const title =
    entry.kind === "task"
      ? entry.item.title
      : entry.kind === "event"
        ? entry.item.title
        : taskTitleForBlock(entry.item, props.tasks, props.nodes);
  const subtitle =
    entry.kind === "block" && entry.item.sourceType === "projectNode"
      ? projectPath(entry.item.sourceId, props.nodes, props.projects, props.goals)
      : "";
  const blockTask =
    entry.kind === "block" && entry.item.sourceType === "task"
      ? props.tasks.find((task) => task.id === entry.item.sourceId) ?? null
      : null;
  const note = blockTask?.notes.trim() || "";
  const completed =
    entry.kind === "task"
      ? entry.item.recurrenceRule
        ? isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt || entry.at || new Date().toISOString())
        : entry.item.status === "completed"
      : entry.kind === "event"
        ? entry.item.status === "completed"
        : entry.item.status === "performed";
  const failed = entry.kind === "task" && entry.item.status === "failed";
  const isCourse = entry.kind === "event" && entry.item.eventKind === "course";
  const isCourseTask = entry.kind === "task" && Boolean(entry.item.courseEventId);
  const location = entry.kind === "event" ? entry.item.location : null;
  const occurrenceDate = isCourse && entry.at
    ? localDateKey(new Date(entry.at))
    : "";
  const courseTasks = isCourse
    ? props.tasks
        .filter(
          (task) =>
            task.planningState !== "draft" &&
            taskBelongsToCourseOccurrence(task, entry.item.id, occurrenceDate),
        )
        .sort((left, right) =>
          (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? ""),
        )
    : [];
  const courseTaskSummary = courseTasks
    .map((task) => (task.status === "completed" ? "✓ " : task.status === "failed" ? "✕ " : "") + task.title)
    .join(" · ");
  const scheduleLabel =
    entry.kind === "task"
      ? entry.timingLabel ?? (
          entry.item.courseEventId
            ? "课内事项"
            : !entry.at ? entry.item.isAllDay ? "全天" : "待安排" : ""
        )
      : "";

  const canDrag =
    (entry.kind !== "task" || !entry.timingLabel) &&
    (entry.kind === "block" || !entry.item.recurrenceRule);
  const durationMs = entry.at && entry.endAt ? new Date(entry.endAt).getTime() - new Date(entry.at).getTime() : 0;
  const isTimePoint = Boolean(entry.at && (!entry.endAt || entry.endAt === entry.at || durationMs < 15 * 60_000));
  const accessibleTitle = showTime && entry.at
    ? `${title} · ${formatTime(entry.at)}${entry.endAt && entry.endAt !== entry.at ? `–${formatTime(entry.endAt)}` : ""}`
    : title;
  return (
    <article
      className={[
        compact ? "compact-calendar-item unified-item" : "time-calendar-item",
        isCourse ? "is-course" : "",
        isCourseTask ? "is-course-task" : "",
        courseDropActive ? "is-drop-target" : "",
        completed ? "is-performed" : "",
        failed ? "is-failed" : "",
        summaryOnly ? "is-summary" : "",
        isTimePoint ? "is-time-point" : "",
      ].join(" ")}
      style={{ "--item-color": entry.color } as CSSProperties}
      onDragEnter={isCourse ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCourseDropActive(true);
      } : undefined}
      onDragOver={isCourse ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
      } : undefined}
      onDragLeave={isCourse ? () => setCourseDropActive(false) : undefined}
      onDrop={entry.kind === "event" && entry.item.eventKind === "course" ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCourseDropActive(false);
        const payload = readDragPayload(event);
        if (payload) void props.onCourseDrop(payload, entry.item, entry.at, entry.endAt);
      } : undefined}
    >
      {isTimePoint && !compact ? (
        <span className="calendar-point-marker" style={{ backgroundColor: entry.color }} aria-hidden="true" />
      ) : null}
      {!isCourse && !(summaryOnly && compact) ? (
        <button
          className={`item-inline-check ${completed ? "is-checked" : ""} ${failed ? "is-failed" : ""}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (entry.kind === "task") props.onTaskComplete(entry.item, entry.occurrenceAt || entry.at || undefined);
            else if (entry.kind === "event") props.onEventComplete(entry.item);
            else props.onBlockComplete(entry.item);
          }}
          aria-label={failed ? `恢复 ${title}` : completed ? `恢复 ${title}` : `完成 ${title}`}
        >
          {failed ? <X size={12} /> : completed ? <Check size={12} /> : <Circle size={13} />}
        </button>
      ) : null}
      {entry.kind === "event" && isCourse && !compact ? (
        <button
          className="course-task-trigger"
          type="button"
          onClick={() => props.onCourseTasks(entry.item, entry.at, entry.endAt)}
          aria-label={`在本节 ${title} 中安排事项`}
          title="在本节课中安排事项"
        >
          <ListPlus size={13} />
        </button>
      ) : null}
      <button
        className="calendar-item-main"
        type="button"
        aria-label={accessibleTitle}
        title={accessibleTitle}
        draggable={canDrag || undefined}
        onDragStart={canDrag ? (event) =>
          setDragPayload(event, { kind: entry.kind, id: entry.item.id }) : undefined}
        onClick={() => {
          if (entry.kind === "task") props.onTask(entry.item, entry.occurrenceAt || entry.at || undefined);
          else if (entry.kind === "event") props.onEvent(entry.item, entry.at);
          else props.onBlock(entry.item);
        }}
      >
        {showTime && entry.at ? (
          <time>
            <span className="calendar-time-start">{formatTime(entry.at)}</span>
            {entry.endAt && entry.endAt !== entry.at ? (
              <span className="calendar-time-end">–{formatTime(entry.endAt)}</span>
            ) : null}
          </time>
        ) : null}
        <span>
          <strong title={title}>{title}</strong>
          {summaryOnly ? null : courseTaskSummary ? (
            <small className="course-card-task-summary" title={courseTaskSummary}>
              事项 · {courseTaskSummary}
            </small>
          ) : scheduleLabel ? (
            <small>{scheduleLabel}</small>
          ) : location && (!isCourse || !hideCourseLocation) ? (
            <small title={location}>{location}</small>
          ) : subtitle ? (
            <small>{subtitle}</small>
          ) : note ? (
            <small>{note}</small>
          ) : null}
        </span>
      </button>
      {canDrag && !(summaryOnly && compact) ? (
        <span
          className="calendar-drag-handle"
          draggable
          onDragStart={(event) =>
            setDragPayload(event, { kind: entry.kind, id: entry.item.id })
          }
          aria-hidden="true"
          title="拖动以调整时间"
        >
          <GripVertical size={12} aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
}
