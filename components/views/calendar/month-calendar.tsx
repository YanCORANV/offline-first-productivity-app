import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { isTaskOccurrenceCompleted, localDateKey, sameLocalDay } from "@/lib/domain";
import { CalendarEntryCard } from "./calendar-entry-card";
import {
  entriesForDay,
  handleDrop,
  dayHasExam,
  type CalendarCommonProps,
  type CalendarEntry,
} from "./calendar-model";

// MONTH_COLLAPSED_ENTRY_LIMIT = 3
const MONTH_COLLAPSED_ENTRY_LIMIT = 4;

function isEntryCompleted(entry: CalendarEntry): boolean {
  if (entry.kind === "task") {
    return entry.item.recurrenceRule
      ? isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt || entry.at || new Date().toISOString())
      : entry.item.status === "completed";
  }
  if (entry.kind === "event") {
    return entry.item.status === "completed";
  }
  return entry.item.status === "performed";
}

export function MonthCalendar({
  days,
  anchor,
  entriesByDay,
  ...props
}: CalendarCommonProps & {
  days: Date[];
  anchor: Date;
  entriesByDay: Map<number, ReturnType<typeof entriesForDay>>;
}) {
  const [expandedDay, setExpandedDay] = useState<{
    monthKey: string;
    dayKey: string;
  } | null>(null);
  const monthKey = `${anchor.getFullYear()}-${anchor.getMonth()}`;
  const expandableDayKeys = new Set(
    days
      .filter(
        (day) =>
          (entriesByDay.get(day.getTime())?.length ?? 0) >
          MONTH_COLLAPSED_ENTRY_LIMIT,
      )
      .map(localDateKey),
  );
  const activeExpandedDayKey =
    expandedDay?.monthKey === monthKey && expandableDayKeys.has(expandedDay.dayKey)
      ? expandedDay.dayKey
      : null;

  return (
    <section
      className={`month-grid execution-calendar ${activeExpandedDayKey ? "has-expanded-day" : ""}`}
    >
      {["一", "二", "三", "四", "五", "六", "日"].map((label) => (
        <div className="month-weekday" key={label}>周{label}</div>
      ))}
      {days.map((day) => {
        const rawEntries = entriesByDay.get(day.getTime()) ?? [];
        const hasExam = dayHasExam(rawEntries, props.itemTypes);
        // Prioritize uncompleted tasks on top, then sort by start time
        const entries = [...rawEntries].sort((a, b) => {
          const aDone = isEntryCompleted(a) ? 1 : 0;
          const bDone = isEntryCompleted(b) ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return a.at.localeCompare(b.at);
        });
        const dayKey = localDateKey(day);
        const expanded = activeExpandedDayKey === dayKey;
        const visibleEntries = expanded
          ? entries
          : entries.slice(0, MONTH_COLLAPSED_ENTRY_LIMIT);
        const hiddenCount = entries.length - MONTH_COLLAPSED_ENTRY_LIMIT;
        const outside = day.getMonth() !== anchor.getMonth();
        return (
          <div
            className={[
              "calendar-column month-day",
              outside ? "is-outside" : "",
              sameLocalDay(new Date().toISOString(), day) ? "is-today" : "",
              sameLocalDay(anchor.toISOString(), day) ? "is-selected-day" : "",
              hasExam ? "has-exam" : "",
              expanded ? "is-expanded" : "",
            ].filter(Boolean).join(" ")}
            key={dayKey}
            onClick={() => props.onSelectDay?.(day)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => void handleDrop(event, day, false, props.onMove)}
          >
            <header>
              <time dateTime={dayKey}>
                <strong>{day.getDate()}</strong>
              </time>
              <div className="month-day-actions">
                {entries.length > MONTH_COLLAPSED_ENTRY_LIMIT ? (
                  <button
                    className="month-day-corner-toggle"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`month-day-items-${dayKey}`}
                    aria-label={expanded ? "收起" : `还有 ${hiddenCount} 项`}
                    onClick={() =>
                      setExpandedDay(expanded ? null : { monthKey, dayKey })
                    }
                  >
                    <span className="month-day-badge">+{hiddenCount}</span>
                    {expanded ? <ChevronUp size={11} aria-hidden="true" /> : <ChevronDown size={11} aria-hidden="true" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="calendar-day-quick-add"
                  onClick={() => props.onAdd(day)}
                  aria-label={`创建 ${day.getMonth() + 1} 月 ${day.getDate()} 日完整事项`}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="mobile-month-dots" aria-hidden="true">
              {entries.slice(0, 4).map((entry) => (
                <span
                  key={entry.instanceKey}
                  className="mobile-month-dot"
                  style={{ backgroundColor: entry.color || "#0071e3" }}
                />
              ))}
            </div>
            <div className="calendar-column-items" id={`month-day-items-${dayKey}`}>
              {visibleEntries.map((entry) => (
                <CalendarEntryCard
                  key={entry.instanceKey}
                  entry={entry}
                  compact
                  showTime={false}
                  {...props}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
