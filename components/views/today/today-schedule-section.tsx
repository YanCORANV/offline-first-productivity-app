import { useState } from "react";
import { CalendarClock, Check, CornerDownLeft, Eye, EyeOff, MoreHorizontal, Plus } from "lucide-react";
import {
  formatTime,
  isTaskOccurrenceCompleted,
  localDateKey,
  type CalendarEvent,
  type PlannerTask,
  type ScheduleBlock,
} from "@/lib/domain";
import { EmptyState } from "../../ui";
import {
  TodayTimeGrid,
  TodayUntimedItem,
  type TodayTimedEntry,
  type TodayUntimedEntry,
} from "./today-timeline";
import { useTodayQuickAddKeyboard } from "./use-today-quick-add-keyboard";

export function TodayScheduleSection({
  allDay,
  untimed,
  timed,
  now,
  date,
  displayStart,
  displayEnd,
  hideCourses = true,
  onHideCoursesChange,
  onOpenCalendar,
  onAddSchedule,
  onQuickAddTask,
  onTask,
  onEvent,
  onBlock,
  onTaskComplete,
  onEventComplete,
  onBlockComplete,
}: {
  allDay: TodayUntimedEntry[];
  untimed: TodayUntimedEntry[];
  timed: TodayTimedEntry[];
  now: Date;
  date?: Date;
  displayStart: string;
  displayEnd: string;
  hideCourses?: boolean;
  onHideCoursesChange?: (hide: boolean) => void;
  onOpenCalendar: () => void;
  onAddSchedule?: () => void;
  onQuickAddTask?: (title: string) => Promise<void>;
  onTask: (task: PlannerTask, occurrenceAt?: string) => void;
  onEvent: (event: CalendarEvent) => void;
  onBlock: (block: ScheduleBlock) => void;
  onTaskComplete: (task: PlannerTask, occurrenceAt?: string) => void;
  onEventComplete: (event: CalendarEvent) => void;
  onBlockComplete: (block: ScheduleBlock) => void;
}) {
  const [quickTaskInput, setQuickTaskInput] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);
  const { formRef, inputRef, onFocus, onBlur, triggerScrollAdjustment } = useTodayQuickAddKeyboard();
  // Build unified mobile agenda items list
  const mobileItems = [
    ...allDay.map((entry) => ({
      key: `allday-${entry.kind}-${entry.item.id}-${entry.occurrenceAt ?? ""}`,
      title: entry.title,
      timeLabel: "全天",
      color: "#5B7B94",
      timingLabel: undefined,
      isCompleted: entry.kind === "task"
        ? entry.item.status === "completed" ||
          Boolean(
            entry.item.recurrenceRule &&
              entry.occurrenceAt &&
              isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt),
          )
        : entry.item.status === "performed",
      onToggle: () => {
        if (entry.kind === "task") onTaskComplete(entry.item, entry.occurrenceAt);
        else onBlockComplete(entry.item);
      },
      onClick: () => {
        if (entry.kind === "task") onTask(entry.item, entry.occurrenceAt);
        else onBlock(entry.item);
      },
    })),
    ...untimed.map((entry) => ({
      key: `untimed-${entry.kind}-${entry.item.id}-${entry.occurrenceAt ?? ""}`,
      title: entry.title,
      timeLabel: "待安排",
      color: "#86868b",
      timingLabel: undefined,
      isCompleted: entry.kind === "task"
        ? entry.item.status === "completed" ||
          Boolean(
            entry.item.recurrenceRule &&
              entry.occurrenceAt &&
              isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt),
          )
        : entry.item.status === "performed",
      onToggle: () => {
        if (entry.kind === "task") onTaskComplete(entry.item, entry.occurrenceAt);
        else onBlockComplete(entry.item);
      },
      onClick: () => {
        if (entry.kind === "task") onTask(entry.item, entry.occurrenceAt);
        else onBlock(entry.item);
      },
    })),
    ...timed.map((entry) => {
      const start = entry.at ? formatTime(entry.at) : "";
      const end = entry.endAt ? formatTime(entry.endAt) : "";
      const timeLabel = start && end && start !== end ? `${start}–${end}` : start || "全天";
      const isCompleted =
        entry.kind === "task"
          ? (entry.item as PlannerTask).status === "completed" ||
            Boolean(
              (entry.item as PlannerTask).recurrenceRule &&
                entry.at &&
                isTaskOccurrenceCompleted(entry.item as PlannerTask, entry.at),
            )
          : entry.kind === "event"
          ? (entry.item as CalendarEvent).status === "completed"
          : (entry.item as ScheduleBlock).status === "performed";
      return {
        key: `timed-${entry.kind}-${entry.item.id}-${entry.instanceKey || entry.at}`,
        title: entry.title,
        timeLabel,
        color: entry.color || "#5B7B94",
        timingLabel: entry.timingLabel,
        isCompleted,
        onToggle: () => {
          if (entry.kind === "task") onTaskComplete(entry.item as PlannerTask, entry.at);
          else if (entry.kind === "event") onEventComplete(entry.item as CalendarEvent);
          else onBlockComplete(entry.item as ScheduleBlock);
        },
        onClick: () => {
          if (entry.kind === "task") onTask(entry.item as PlannerTask);
          else if (entry.kind === "event") onEvent(entry.item as CalendarEvent);
          else onBlock(entry.item as ScheduleBlock);
        },
      };
    }),
  ];

  const isSelectedToday = !date || localDateKey(date) === localDateKey(new Date());
  const headingTitle = isSelectedToday
    ? "今日安排"
    : `${date ? date.getMonth() + 1 : ""}月${date ? date.getDate() : ""}日 安排`;

  return (
    <section className="content-card timeline-card today-schedule-card">
      <header className="today-ref-card-header today-schedule-heading">
        <h2 className="today-ref-card-title">{headingTitle}</h2>
        <div className="today-schedule-actions">
          {onAddSchedule ? (
            <button
              className="today-ref-add-btn"
              type="button"
              onClick={onAddSchedule}
              aria-label={`给${isSelectedToday ? "今天" : "该日"}添加事项`}
              title={`给${isSelectedToday ? "今天" : "该日"}添加事项`}
            >
              <Plus size={14} aria-hidden="true" />
              <span>添加事项</span>
            </button>
          ) : null}
          {onHideCoursesChange ? (
            <button
              className="today-ref-more-btn"
              type="button"
              aria-pressed={hideCourses}
              onClick={() => onHideCoursesChange(!hideCourses)}
              title={hideCourses ? "显示课程表" : "隐藏课程表"}
            >
              {hideCourses ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          ) : null}
          <button
            className="today-ref-more-btn"
            type="button"
            onClick={onOpenCalendar}
            aria-label="打开日历"
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Compact Agenda List */}
      <div className="today-mobile-agenda">
        {mobileItems.length ? (
          <div className="today-mobile-agenda-list">
            {mobileItems.map((item) => (
              <div
                key={item.key}
                className={`today-mobile-agenda-row ${item.isCompleted ? "is-completed" : ""}`}
              >
                <button
                  type="button"
                  className="today-mobile-check-btn"
                  onClick={item.onToggle}
                  aria-label={`标记${item.isCompleted ? "未完成" : "完成"} ${item.title}`}
                >
                  <span className={`today-mobile-circle ${item.isCompleted ? "is-checked" : ""}`}>
                    {item.isCompleted ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                </button>
                <span className="today-mobile-color-bar" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <div className="today-mobile-agenda-text" onClick={item.onClick}>
                  <span className="today-mobile-item-title">{item.title}</span>
                  {item.timingLabel ? (
                    <span className="today-mobile-timing-badge">{item.timingLabel}</span>
                  ) : null}
                </div>
                <span className="today-mobile-agenda-time">{item.timeLabel}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="today-mobile-empty">{isSelectedToday ? "今日暂无安排" : "该日暂无安排"}</p>
        )}
      </div>

      {/* Desktop Visual Timeline Grid */}
      <div className="today-desktop-timeline">
        {allDay.length ? (
          <div className="today-agenda-row is-all-day">
            <span>全天</span>
            <div>
              {allDay.map((entry) => (
                <TodayUntimedItem
                  key={`${entry.kind}-${entry.item.id}-${entry.occurrenceAt ?? ""}`}
                  entry={entry}
                  onTask={onTask}
                  onBlock={onBlock}
                  onTaskComplete={onTaskComplete}
                  onBlockComplete={onBlockComplete}
                />
              ))}
            </div>
          </div>
        ) : null}

        {untimed.length ? (
          <div className="today-agenda-row is-untimed">
            <span>待安排</span>
            <div>
              {untimed.map((entry) => (
                <TodayUntimedItem
                  key={`${entry.kind}-${entry.item.id}-${entry.occurrenceAt ?? ""}`}
                  entry={entry}
                  onTask={onTask}
                  onBlock={onBlock}
                  onTaskComplete={onTaskComplete}
                  onBlockComplete={onBlockComplete}
                />
              ))}
            </div>
          </div>
        ) : null}

        {timed.length ? (
          <TodayTimeGrid
            entries={timed}
            now={now}
            date={date}
            displayStart={displayStart}
            displayEnd={displayEnd}
            onTask={onTask}
            onEvent={onEvent}
            onBlock={onBlock}
            onTaskComplete={onTaskComplete}
            onEventComplete={onEventComplete}
            onBlockComplete={onBlockComplete}
          />
        ) : allDay.length || untimed.length ? null : (
          <EmptyState icon={<CalendarClock size={20} />} title={isSelectedToday ? "今天还没有安排" : "该日还没有安排"} />
        )}
      </div>

      {/* 快速添加到今日安排输入框 */}
      {onQuickAddTask ? (
        <form
          ref={formRef}
          className="today-inbox-quick-add today-schedule-quick-add"
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = quickTaskInput.trim();
            if (!trimmed || submittingTask) return;
            setSubmittingTask(true);
            try {
              await onQuickAddTask(trimmed);
              setQuickTaskInput("");
              triggerScrollAdjustment();
            } finally {
              setSubmittingTask(false);
            }
          }}
        >
          <Plus size={15} className="today-inbox-add-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="today-inbox-input"
            placeholder="快速添加事项... (Enter)"
            value={quickTaskInput}
            onChange={(e) => setQuickTaskInput(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={submittingTask}
          />
          <button
            type="submit"
            className="today-inbox-submit-btn"
            disabled={!quickTaskInput.trim() || submittingTask}
            aria-label={`添加到${isSelectedToday ? "今日" : "该日"}安排`}
          >
            <CornerDownLeft size={13} aria-hidden="true" />
          </button>
        </form>
      ) : null}
    </section>
  );
}
