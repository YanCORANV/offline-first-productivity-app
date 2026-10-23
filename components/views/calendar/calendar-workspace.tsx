import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { isTaskOccurrenceCompleted, formatTime, localDateKey } from "@/lib/domain";
import { MonthCalendar, TimeGrid } from "./calendar-grid";
import { entriesForDays, dayHasExam, type CalendarCommonProps, type CalendarEntry } from "./calendar-model";
import type { CalendarMode } from "./calendar-toolbar";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function formatEntryTimeRange(entry: CalendarEntry) {
  const start = entry.at ? formatTime(entry.at) : "";
  const end = entry.endAt ? formatTime(entry.endAt) : "";
  if (start && end && start !== end) {
    return `${start}–${end}`;
  }
  return start || "全天";
}

function MobileWeekAgenda({
  days,
  entriesByDay,
  ...props
}: CalendarCommonProps & {
  days: Date[];
  entriesByDay: Map<number, CalendarEntry[]>;
}) {
  const todayKey = localDateKey(new Date());
  const todayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hasToday = days.some((d) => localDateKey(d) === todayKey);
    if (hasToday && todayRef.current) {
      const timer = setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [days, todayKey]);

  return (
    <div className="mobile-week-agenda" aria-label="周日程纵向列表">
      {days.map((day, i) => {
        const dateKey = localDateKey(day);
        const isToday = dateKey === todayKey;
        const entries = entriesByDay.get(day.getTime()) ?? [];
        const hasExam = dayHasExam(entries, props.itemTypes);

        const hasEntries = entries.length > 0;

        return (
          <div
            key={dateKey}
            id={isToday ? "mobile-week-day-today" : undefined}
            ref={isToday ? todayRef : undefined}
            className={[
              "mobile-week-day-section",
              isToday ? "is-today" : "",
              hasExam ? "has-exam" : "",
              hasEntries ? "" : "is-empty",
            ].filter(Boolean).join(" ")}
          >
            <div className="mobile-week-day-header">
              <span className="mobile-week-day-title">
                {WEEKDAYS[i]} {day.getDate()}日
              </span>
              {hasExam ? <span className="mobile-week-exam-pill">考试</span> : null}
              {isToday ? <span className="mobile-week-today-pill">今天</span> : null}
              {!hasEntries ? <span className="mobile-week-empty-badge">无事项</span> : null}
            </div>

            {hasEntries ? (
              <div className="mobile-week-day-events">
                {entries.map((entry) => {
                  const title =
                    entry.kind === "block"
                      ? (entry.item.sourceType === "task"
                          ? props.tasks.find((t) => t.id === entry.item.sourceId)?.title
                          : props.nodes.find((n) => n.id === entry.item.sourceId)?.title) || "时间块"
                      : entry.item.title;
                  const isDone =
                    entry.kind === "task"
                      ? entry.item.recurrenceRule
                        ? isTaskOccurrenceCompleted(
                            entry.item,
                            entry.occurrenceAt || entry.at || new Date().toISOString(),
                          )
                        : entry.item.status === "completed"
                      : entry.kind === "event"
                      ? entry.item.status === "completed"
                      : entry.item.status === "performed";
                  const isFailed = entry.kind === "task" && entry.item.status === "failed";

                  return (
                    <div
                      key={entry.instanceKey}
                      className={`mobile-week-event-row ${isDone ? "is-done" : ""} ${isFailed ? "is-failed" : ""}`}
                    >
                      <button
                        type="button"
                        className="mobile-week-check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (entry.kind === "task") props.onTaskComplete(entry.item, entry.occurrenceAt || entry.at || undefined);
                          else if (entry.kind === "event") props.onEventComplete(entry.item);
                          else props.onBlockComplete(entry.item);
                        }}
                        aria-label={isFailed ? `恢复 ${title}` : `标记${isDone ? "未完成" : "完成"} ${title}`}
                      >
                        <span className={`mobile-week-check-circle ${isDone ? "is-checked" : ""} ${isFailed ? "is-failed" : ""}`}>
                          {isFailed ? <X size={11} strokeWidth={3} /> : isDone ? <Check size={11} strokeWidth={3} /> : null}
                        </span>
                      </button>
                      <span
                        className="mobile-week-color-bar"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      <div
                        className="mobile-week-event-info"
                        onClick={() => {
                          if (entry.kind === "task") props.onTask(entry.item, entry.occurrenceAt || entry.at || undefined);
                          else if (entry.kind === "event") props.onEvent(entry.item, entry.at);
                          else props.onBlock(entry.item);
                        }}
                      >
                        <span className="mobile-week-event-title">{title}</span>
                      </div>
                      <span className="mobile-week-event-time">
                        {formatEntryTimeRange(entry)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarWorkspace({
  mode,
  presentation,
  days,
  anchor,
  periodLabel,
  calendarProps,
  hideCourses,
  onSwipeMonth,
}: {
  mode: CalendarMode;
  presentation: "overview" | "timeline";
  days: Date[];
  anchor: Date;
  periodLabel: string;
  calendarProps: CalendarCommonProps;
  hideCourses: boolean;
  onSwipeMonth?: (direction: -1 | 1) => void;
}) {
  const entriesByDay = useMemo(
    () => entriesForDays(days, calendarProps, { hideCourses }),
    [calendarProps, days, hideCourses],
  );

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Track month change for directional slide animation
  const currentMonthIndex = anchor.getFullYear() * 12 + anchor.getMonth();
  const [prevMonthIndex, setPrevMonthIndex] = useState(currentMonthIndex);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);

  if (prevMonthIndex !== currentMonthIndex) {
    setPrevMonthIndex(currentMonthIndex);
    if (mode === "month") {
      setSlideDirection(currentMonthIndex > prevMonthIndex ? "next" : "prev");
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode !== "month" || !onSwipeMonth || e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || mode !== "month" || !onSwipeMonth) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Must be predominantly horizontal swipe and >= 40px
    if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      // Swipe left -> next month (direction 1); swipe right -> prev month (direction -1)
      if (deltaX < 0) {
        onSwipeMonth(1);
      } else {
        onSwipeMonth(-1);
      }
    }
  };

  return (
    <div
      className={[
        "calendar-workspace",
        `calendar-${mode}`,
      ].filter(Boolean).join(" ")}
      onTouchStart={mode === "month" ? handleTouchStart : undefined}
      onTouchEnd={mode === "month" ? handleTouchEnd : undefined}
    >
      <section className="calendar-main">
        {mode === "month" ? (
          <header className="calendar-period-heading" aria-live="polite">
            <h2>{periodLabel}</h2>
          </header>
        ) : null}
        {mode === "month" ? (
          <div className="month-calendar-viewport">
            <div
              key={`${anchor.getFullYear()}-${anchor.getMonth()}`}
              className={`month-calendar-animator ${
                slideDirection === "next"
                  ? "is-sliding-next"
                  : slideDirection === "prev"
                  ? "is-sliding-prev"
                  : ""
              }`}
            >
              <MonthCalendar days={days} anchor={anchor} entriesByDay={entriesByDay} {...calendarProps} />
            </div>
          </div>
        ) : (
          <>
            <div className="desktop-time-grid">
              <TimeGrid days={days} entriesByDay={entriesByDay} presentation={presentation} {...calendarProps} />
            </div>
            {days.length > 1 ? (
              <MobileWeekAgenda days={days} entriesByDay={entriesByDay} {...calendarProps} />
            ) : (
              <div className="mobile-day-time-grid">
                <TimeGrid days={days} entriesByDay={entriesByDay} presentation="timeline" {...calendarProps} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
