import { useState, type CSSProperties } from "react";
import { Plus, Zap } from "lucide-react";
import {
  buildCalendarTimelineScale,
  compactTimelineMinuteAtY,
  compactTimelineY,
} from "@/lib/planning";
import { localDateKey, sameLocalDay } from "@/lib/domain";
import { CalendarEntryCard } from "./calendar-entry-card";
import { CalendarPopover } from "./calendar-popover";
import { useCalendarTimelineHeight } from "./use-calendar-timeline-height";
import {
  isAllDayEntry,
  dayHasExam,
  displayClockMinutes,
  entriesForDay,
  formatClockMarker,
  handleDrop,
  parseClockMinutes,
  positionEntries,
  fittedCalendarHourScale,
  TIMELINE_PADDING,
  type CalendarCommonProps,
  type CalendarEntry,
} from "./calendar-model";

export function TimeGrid({
  days,
  entriesByDay,
  presentation = "overview",
  ...props
}: CalendarCommonProps & {
  days: Date[];
  entriesByDay: Map<number, ReturnType<typeof entriesForDay>>;
  presentation?: "overview" | "timeline";
}) {
  const { timelineRef, availableHeight } = useCalendarTimelineHeight(presentation === "timeline");
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    Math.max(0, days.findIndex((day) => sameLocalDay(new Date().toISOString(), day))),
  );
  const selectedDay = days[selectedDayIndex] ?? days[0];
  const selectedEntries = selectedDay ? entriesByDay.get(selectedDay.getTime()) ?? [] : [];
  const now = new Date();
  const startMinute = parseClockMinutes(props.displayStart);
  const configuredEnd = parseClockMinutes(props.displayEnd);
  const endMinute = configuredEnd <= startMinute ? configuredEnd + 24 * 60 : configuredEnd;
  const timedEntriesByDay = days.map((day) =>
    (entriesByDay.get(day.getTime()) ?? []).filter((entry) => entry.at),
  );
  const timelineStart = startMinute;
  const timelineEnd = endMinute;
  const { scale, markerMinutes } = buildCalendarTimelineScale(
    timelineStart,
    timelineEnd,
    fittedCalendarHourScale(timelineStart, timelineEnd, availableHeight),
  );
  const positionedEntriesByDay = timedEntriesByDay.map((entries) =>
    positionEntries(entries, scale, startMinute, endMinute),
  );

  const entryBottom = positionedEntriesByDay
    .flat()
    .reduce((maximum, entry) => Math.max(maximum, entry.top + entry.height), 0);
  const height = availableHeight ?? Math.max(
    180,
    scale.height + TIMELINE_PADDING * 2,
    entryBottom + TIMELINE_PADDING,
  );
  return (
    <section
      className={["time-grid", `is-${presentation}`, days.length === 1 ? "calendar-day-grid" : ""].filter(Boolean).join(" ")}
      style={{ "--calendar-days": days.length } as CSSProperties}
    >
      <div className="time-grid-corner" aria-hidden="true" />
      <div className="time-grid-day-headings">
        {days.map((day, index) => {
          const dayEntries = entriesByDay.get(day.getTime()) ?? [];
          const hasExam = dayHasExam(dayEntries, props.itemTypes);
          return (
            <div
              key={localDateKey(day)}
              className={[
                "time-grid-day-heading",
                sameLocalDay(now.toISOString(), day) ? "is-today" : "",
                hasExam ? "has-exam" : "",
              ].filter(Boolean).join(" ")}
              data-calendar-day-heading
            >
              <button
                type="button"
                className="calendar-day-quick-add"
                aria-label={`快速添加 ${day.getMonth() + 1} 月 ${day.getDate()} 日事项`}
                title="快速记录"
                onClick={() => props.onQuickAdd(day)}
              >
                <Zap size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="time-grid-day-label"
                aria-label={`查看 ${day.getMonth() + 1} 月 ${day.getDate()} 日事项`}
                aria-pressed={selectedDayIndex === index}
                onClick={() => setSelectedDayIndex(index)}
              >
                <span>{new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(day)}</span>
                <strong>{day.getDate()}</strong>
              </button>
              <button
                type="button"
                className="calendar-day-add"
                aria-label={`创建 ${day.getMonth() + 1} 月 ${day.getDate()} 日完整事项`}
                title="新建完整事项"
                onClick={() => props.onAdd(day)}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="calendar-week-overview">
        {days.map((day, index) => {
          const entries = entriesByDay.get(day.getTime()) ?? [];
          const hasExam = dayHasExam(entries, props.itemTypes);
          return (
            <div
              key={localDateKey(day)}
              className={[
                "calendar-overview-day",
                hasExam ? "has-exam" : "",
              ].filter(Boolean).join(" ")}
              data-selected={selectedDayIndex === index}
            >
              <DayColors entries={entries} />
              {entries.length ? entries.map((entry) => (
                <CalendarEntryCard key={entry.instanceKey} entry={entry} compact summaryOnly {...props} />
              )) : <span className="calendar-overview-empty">—</span>}
            </div>
          );
        })}
      </div>
      <section className="calendar-selected-day" aria-label="当天完整事项">
        <h3>{selectedDay ? `${selectedDay.getMonth() + 1} 月 ${selectedDay.getDate()} 日` : ""}</h3>
        {selectedEntries.length ? selectedEntries.map((entry) => (
          <CalendarEntryCard key={entry.instanceKey} entry={entry} compact {...props} />
        )) : <p>当天没有事项</p>}
      </section>

      <div className="time-grid-all-day-label" />
      <div className="time-grid-all-day">
        {days.map((day) => {
          const dayEntries = entriesByDay.get(day.getTime()) ?? [];
          const allDay = dayEntries.filter((entry) => !entry.at);
          const hasExam = dayHasExam(dayEntries, props.itemTypes);
          return (
            <div
              key={localDateKey(day)}
              className={[
                "all-day-column",
                hasExam ? "has-exam" : "",
              ].filter(Boolean).join(" ")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void handleDrop(event, day, false, props.onMove)}
            >
              {allDay.slice(0, 2).map((entry) => (
                <CalendarEntryCard
                  key={entry.instanceKey}
                  entry={entry}
                  compact
                  summaryOnly
                  hideCourseLocation={days.length > 1}
                  {...props}
                />
              ))}
              {allDay.length > 2 ? (
                <CalendarPopover name={`查看 ${day.getMonth() + 1} 月 ${day.getDate()} 日无具体时间事项`} className="all-day-more" label={`+${allDay.length - 2}`}>
                  <div className="calendar-date-items">
                    {allDay.map((entry) => (
                      <div key={entry.instanceKey} data-close-popover>
                        <CalendarEntryCard entry={entry} compact {...props} />
                      </div>
                    ))}
                  </div>
                </CalendarPopover>
              ) : null}
            </div>
          );
        })}
      </div>

      <div ref={timelineRef} className="time-grid-hours" style={{ height }}>
        {markerMinutes.map((minute) => (
          <span
            key={minute}
            className={[
              "sparse-time-label",
              minute === timelineStart ? "is-start" : "",
              minute === timelineEnd ? "is-end" : "",
            ].filter(Boolean).join(" ")}
            style={{
              top: Math.min(height - 1, TIMELINE_PADDING + compactTimelineY(minute, scale)),
            }}
          >
            {formatClockMarker(minute)}
          </span>
        ))}
      </div>

      <div className="time-grid-days" style={{ height }}>
        {markerMinutes.map((minute) => (
          <span
            className="sparse-time-rule"
            key={minute}
            style={{
              top: Math.min(height - 1, TIMELINE_PADDING + compactTimelineY(minute, scale)),
            }}
          />
        ))}
        {days.map((day, dayIndex) => {
          const entries = positionedEntriesByDay[dayIndex];
          const dayEntries = entriesByDay.get(day.getTime()) ?? [];
          const today = sameLocalDay(now.toISOString(), day);
          const hasExam = dayHasExam(dayEntries, props.itemTypes);
          const nowMinute = displayClockMinutes(now, startMinute, endMinute);
          const nowTop = TIMELINE_PADDING + compactTimelineY(nowMinute, scale);
          return (
            <div
              key={localDateKey(day)}
              className={[
                "time-day-column",
                today ? "is-today" : "",
                hasExam ? "has-exam" : "",
              ].filter(Boolean).join(" ")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const y = Math.max(
                  0,
                  Math.min(scale.height, event.clientY - rect.top - TIMELINE_PADDING),
                );
                const target = new Date(day);
                const targetMinute = Math.round(compactTimelineMinuteAtY(y, scale) / 15) * 15;
                target.setHours(0, targetMinute, 0, 0);
                void handleDrop(event, target, true, props.onMove);
              }}
              onDoubleClick={(event) => {
                if ((event.target as HTMLElement).closest("button, article")) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const y = Math.max(
                  0,
                  Math.min(scale.height, event.clientY - rect.top - TIMELINE_PADDING),
                );
                const target = new Date(day);
                const targetMinute = Math.round(compactTimelineMinuteAtY(y, scale) / 15) * 15;
                target.setHours(0, targetMinute, 0, 0);
                props.onAdd(target, true);
              }}
            >
              <DayColors entries={dayEntries} />
              {today && nowMinute >= scale.startMinute && nowMinute <= scale.endMinute ? (
                <span className="current-time-line" style={{ top: nowTop }} />
              ) : null}
              {entries.map(({ entry, top, height: entryHeight, lane, lanes }) => (
                <div
                  key={entry.instanceKey}
                  className={
                    [
                      "positioned-calendar-entry",
                      lanes > 1 ? "is-concurrent" : "",
                      entry.kind === "event" &&
                      entry.item.eventKind === "course" &&
                      Date.parse(entry.endAt) < now.getTime()
                        ? "is-past-course"
                        : "",
                    ].filter(Boolean).join(" ")
                  }
                  style={{
                    top,
                    height: entryHeight,
                    left: `calc(${(lane / lanes) * 100}% + 1px)`,
                    width: `calc(${100 / lanes}% - 2px)`,
                  }}
                >
                  <CalendarEntryCard
                    entry={entry}
                    summaryOnly
                    hideCourseLocation={days.length > 1}
                    {...props}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DayColors({ entries }: { entries: CalendarEntry[] }) {
  const allDayEntries = entries.filter(isAllDayEntry);
  return allDayEntries.length ? (
    <span className="calendar-day-colors" aria-hidden="true">
      {allDayEntries.map((entry) => (
        <span key={entry.instanceKey} style={{ "--item-color": entry.color } as CSSProperties} />
      ))}
    </span>
  ) : null;
}
