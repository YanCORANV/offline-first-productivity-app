import { useRef } from "react";
import { Calendar, Clock, MapPin, Plus, Repeat, X } from "lucide-react";
import type { AssignmentStatus, QuickThought } from "@/lib/domain";
import type { RepeatPreset } from "../../composer-shared";

function clockAfterMinutes(clock: string, minutes: number): string {
  const [h, m] = clock.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function is12HourTime(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).formatToParts(new Date());
    if (parts.some((p) => p.type === "dayPeriod")) return true;
    const formatted = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(
      new Date(2020, 0, 1, 13, 0),
    );
    return !formatted.includes("13");
  } catch {
    return true;
  }
}

function useFieldNav() {
  const segIndexRef = useRef<Record<string, number>>({});

  const handleFocus = (fieldId: string) => {
    segIndexRef.current[fieldId] = 0;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    fieldId: string,
    type: "date" | "time",
    onPrev?: () => void,
    onNext?: () => void,
  ) => {
    const maxSegments = type === "date" ? 3 : is12HourTime() ? 3 : 2;

    if (e.key === "ArrowRight") {
      const currentSeg = segIndexRef.current[fieldId] ?? 0;
      if (currentSeg >= maxSegments - 1) {
        if (onNext) {
          e.preventDefault();
          onNext();
        }
      } else {
        segIndexRef.current[fieldId] = currentSeg + 1;
      }
    } else if (e.key === "ArrowLeft") {
      const currentSeg = segIndexRef.current[fieldId] ?? 0;
      if (currentSeg <= 0) {
        if (onPrev) {
          e.preventDefault();
          onPrev();
        }
      } else {
        segIndexRef.current[fieldId] = currentSeg - 1;
      }
    } else if (e.key === "Enter") {
      if (onNext) {
        e.preventDefault();
        onNext();
      }
    }
  };

  return { handleFocus, handleKeyDown };
}

type RepeatUnit = "daily" | "weekly" | "monthly";
export type TaskScheduleMode = "timed" | "unscheduled" | "all-day" | "morning" | "afternoon" | "evening";

export function TaskScheduleSection(props: {
  isMobile?: boolean;
  isCourse: boolean;
  isDeadline: boolean;
  date: string;
  courseFirstDate: string;
  scheduleMode: TaskScheduleMode;
  location: string;
  startTime: string;
  endTime: string;
  duration: string;
  desiredAt?: string;
  assignmentStatus?: AssignmentStatus;
  repeat?: RepeatPreset;
  repeatInterval?: string;
  repeatUnit?: RepeatUnit;
  repeatWeekdays?: number[];
  recurrenceEndAt?: string;
  repeatSummary?: string;
  notes?: string;
  origins?: QuickThought[];
  reminders?: number[];
  onRemindersChange?: (values: number[]) => void;
  onNotesChange?: (value: string) => void;
  onDateChange: (value: string) => void;
  onScheduleModeChange: (value: TaskScheduleMode) => void;
  onLocationChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onAssignmentStatusChange?: (value: AssignmentStatus) => void;
  onDesiredAtChange?: (value: string) => void;
  onRepeatChange?: (value: RepeatPreset) => void;
  onRepeatIntervalChange?: (value: string) => void;
  onRepeatUnitChange?: (value: RepeatUnit) => void;
  onRepeatWeekdaysChange?: (value: number[]) => void;
  onRecurrenceEndAtChange?: (value: string) => void;
  onDirty: () => void;
}) {
  const {
    isCourse,
    isDeadline,
    date,
    courseFirstDate,
    scheduleMode,
    location,
    startTime,
    endTime,
    duration,
    desiredAt = "",
    repeatWeekdays = [],
    recurrenceEndAt = "",
    onDateChange,
    onScheduleModeChange,
    onLocationChange,
    onStartTimeChange,
    onEndTimeChange,
    onDurationChange,
    onDesiredAtChange = () => {},
    onRepeatWeekdaysChange = () => {},
    onRecurrenceEndAtChange = () => {},
    onDirty,
  } = props;
  const hasTime = scheduleMode === "timed" || scheduleMode === "morning" || scheduleMode === "afternoon" || scheduleMode === "evening";
  const { handleFocus, handleKeyDown } = useFieldNav();

  // Ordinary task refs
  const taskDateRef = useRef<HTMLInputElement>(null);
  const taskStartRef = useRef<HTMLInputElement>(null);
  const taskEndRef = useRef<HTMLInputElement>(null);

  // Deadline task refs
  const deadlineDateRef = useRef<HTMLInputElement>(null);
  const deadlineTimeRef = useRef<HTMLInputElement>(null);
  const desiredDateRef = useRef<HTMLInputElement>(null);
  const desiredTimeRef = useRef<HTMLInputElement>(null);

  // Course refs
  const courseStartRef = useRef<HTMLInputElement>(null);
  const courseEndRef = useRef<HTMLInputElement>(null);

  function activateTimedMode() {
    if (scheduleMode === "timed") return;
    onDirty();
    onScheduleModeChange("timed");
  }

  function selectScheduleOverride(mode: TaskScheduleMode) {
    if (scheduleMode === mode) return;
    onDirty();
    if (mode === "morning") {
      onStartTimeChange("09:00");
      onEndTimeChange("12:00");
      onDurationChange("custom");
    } else if (mode === "afternoon") {
      onStartTimeChange("12:00");
      onEndTimeChange("18:00");
      onDurationChange("custom");
    } else if (mode === "evening") {
      onStartTimeChange("18:00");
      onEndTimeChange("22:00");
      onDurationChange("custom");
    } else if (mode === "unscheduled" || mode === "all-day") {
      onDurationChange("none");
    }
    onScheduleModeChange(mode);
  }

  if (isCourse) {
    const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
    const selectedDays = repeatWeekdays
      .slice()
      .sort((a, b) => a - b)
      .map((day) => `周${weekdayLabels[day]}`)
      .join("、");
    const dateRangeValid = Boolean(
      date &&
        recurrenceEndAt &&
        courseFirstDate &&
        recurrenceEndAt >= courseFirstDate,
    );
    const timeRangeValid = Boolean(startTime && endTime && startTime !== endTime);

    return (
      <section className="task-editor-section task-schedule-column is-course course-schedule-section">
        <div className="apple-datetime-card is-course">
          {/* Row 1: 学期日期范围 (学期开始 & 学期结束) */}
          <div className="course-term-grid">
            <label className="field apple-field">
              <span className="apple-field-label">
                <Calendar size={14} className="apple-field-icon" aria-hidden="true" />
                <span>学期开始</span>
              </span>
              <div className="apple-input-wrapper">
                <input
                  type="date"
                  value={date}
                  required
                  aria-invalid={Boolean(date && recurrenceEndAt && !dateRangeValid)}
                  onChange={(event) => onDateChange(event.target.value)}
                />
              </div>
            </label>
            <label className="field apple-field">
              <span className="apple-field-label">
                <Calendar size={14} className="apple-field-icon" aria-hidden="true" />
                <span>学期结束</span>
              </span>
              <div className="apple-input-wrapper">
                <input
                  type="date"
                  value={recurrenceEndAt}
                  min={date || undefined}
                  required
                  aria-invalid={Boolean(recurrenceEndAt && !dateRangeValid)}
                  onChange={(event) => onRecurrenceEndAtChange(event.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Row 2: 每周上课日 (一 二 三 四 五 六 日) */}
          <div className="course-weekday-field apple-field">
            <span className="apple-field-label">
              <Repeat size={14} className="apple-field-icon" aria-hidden="true" />
              <span>每周上课日</span>
              <span className="apple-optional-tag">(可多选)</span>
            </span>
            <div className="course-weekday-selector" role="group" aria-label="每周上课日">
              {weekdayLabels.map((label, index) => {
                const selected = repeatWeekdays.includes(index);
                return (
                  <button
                    type="button"
                    key={label}
                    className={selected ? "is-active" : ""}
                    aria-pressed={selected}
                    aria-label={`周${label}`}
                    onClick={() => {
                      onDirty();
                      onRepeatWeekdaysChange(
                        selected
                          ? repeatWeekdays.filter((day) => day !== index)
                          : [...repeatWeekdays, index],
                      );
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: 上课时间范围 (开始时间 & 结束时间) */}
          <div className="course-time-grid">
            <label className="field apple-field">
              <span className="apple-field-label">
                <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                <span>开始时间</span>
              </span>
              <div className="apple-input-wrapper">
                <input
                  type="time"
                  ref={courseStartRef}
                  value={startTime}
                  required
                  aria-invalid={Boolean(startTime && endTime && !timeRangeValid)}
                  onChange={(event) => onStartTimeChange(event.target.value)}
                  onFocus={() => handleFocus("course-start")}
                  onKeyDown={(e) => handleKeyDown(e, "course-start", "time", undefined, () => courseEndRef.current?.focus())}
                />
              </div>
            </label>
            <label className="field apple-field">
              <span className="apple-field-label">
                <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                <span>结束时间</span>
              </span>
              <div className="apple-input-wrapper">
                {/* <span>结束时间</span> <input type="time" */}
                <input
                  type="time"
                  ref={courseEndRef}
                  value={endTime}
                  required
                  aria-invalid={Boolean(startTime && endTime && !timeRangeValid)}
                  onChange={(event) => onEndTimeChange(event.target.value)}
                  onFocus={() => handleFocus("course-end")}
                  onKeyDown={(e) => handleKeyDown(e, "course-end", "time", () => courseStartRef.current?.focus(), undefined)}
                />
              </div>
            </label>
          </div>

          {/* Row 4: 上课地点 (可选) */}
          <label className="field course-location-field apple-field">
            <span className="apple-field-label">
              <MapPin size={14} className="apple-field-icon" aria-hidden="true" />
              <span>上课地点</span>
              <span className="apple-optional-tag">(可选)</span>
            </span>
            <div className="apple-input-wrapper">
              <input
                value={location}
                onChange={(event) => onLocationChange(event.target.value)}
                placeholder="例如：教学楼 A203"
              />
            </div>
          </label>

          {/* Row 5: 课程排期提示 */}
          <p className="course-schedule-summary" aria-live="polite">
            {!timeRangeValid
              ? "结束时间不能与开始时间相同。"
              : selectedDays
              ? `${selectedDays} · ${startTime}–${endTime}${dateRangeValid ? ` · ${date} 至 ${recurrenceEndAt}` : ""}`
              : "请选择每周上课日和时间。"}
          </p>
        </div>
      </section>
    );
  }

  const handleTaskDateNext = () => {
    taskStartRef.current?.focus();
  };

  const handleTaskStartNext = () => {
    if (duration !== "custom") {
      onDirty();
      const nextEnd = endTime || clockAfterMinutes(startTime || "09:00", 60);
      onEndTimeChange(nextEnd);
      onDurationChange("custom");
      requestAnimationFrame(() => {
        taskEndRef.current?.focus();
      });
    } else {
      taskEndRef.current?.focus();
    }
  };

  const handleTaskEndPrev = () => {
    taskStartRef.current?.focus();
  };

  if (isDeadline) {
    const desiredDate = desiredAt ? desiredAt.slice(0, 10) : "";
    const desiredTime = desiredAt && desiredAt.length >= 16 ? desiredAt.slice(11, 16) : "";
    const hasDesired = Boolean(desiredDate || desiredTime);

    const handleDeadlineDateNext = () => {
      deadlineTimeRef.current?.focus();
    };
    const handleDeadlineTimePrev = () => {
      deadlineDateRef.current?.focus();
    };
    const handleDeadlineTimeNext = () => {
      if (hasDesired) {
        desiredDateRef.current?.focus();
      }
    };
    const handleDesiredDatePrev = () => {
      deadlineTimeRef.current?.focus();
    };
    const handleDesiredDateNext = () => {
      desiredTimeRef.current?.focus();
    };
    const handleDesiredTimePrev = () => {
      desiredDateRef.current?.focus();
    };

    return (
      <section className="task-editor-section task-schedule-column is-task is-deadline-composer">
        <div className="apple-datetime-card is-deadline">
          {/* Row 1: 实际截止日期 (日期 + 时间) */}
          <div className="deadline-datetime-row">
            <label className="field apple-field">
              <span className="apple-field-label">
                <Calendar size={14} className="apple-field-icon" aria-hidden="true" />
                <span>实际截止日期</span>
              </span>
              <div className="apple-input-wrapper">
                <input
                  ref={deadlineDateRef}
                  aria-label="实际截止日期"
                  type="date"
                  value={date}
                  onChange={(event) => onDateChange(event.target.value)}
                  onFocus={() => handleFocus("dl-date")}
                  onKeyDown={(e) => handleKeyDown(e, "dl-date", "date", undefined, handleDeadlineDateNext)}
                />
              </div>
            </label>

            <label className="field task-time-entry-row is-deadline apple-field">
              <span className="apple-field-label">
                <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                <span>截止时间</span>
              </span>
              <div className="apple-input-wrapper">
                <input
                  ref={deadlineTimeRef}
                  aria-label="截止时间"
                  type="time"
                  required
                  value={startTime}
                  onChange={(event) => onStartTimeChange(event.target.value)}
                  onFocus={() => handleFocus("dl-time")}
                  onKeyDown={(e) => handleKeyDown(e, "dl-time", "time", handleDeadlineTimePrev, handleDeadlineTimeNext)}
                />
              </div>
            </label>
          </div>

          {/* Row 2: 预计完成 (可选) */}
          {hasDesired ? (
            <div className="deadline-datetime-row is-secondary-row">
              <label className="field apple-field">
                <span className="apple-field-label">
                  <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                  <span>预计完成日期</span>
                  <span className="apple-optional-tag">(可选)</span>
                </span>
                <div className="apple-input-wrapper">
                  <input
                    ref={desiredDateRef}
                    aria-label="预计完成日期"
                    type="date"
                    value={desiredDate}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      onDesiredAtChange(
                        nextDate
                          ? desiredTime
                            ? `${nextDate}T${desiredTime}`
                            : `${nextDate}T${startTime || "18:00"}`
                          : "",
                      );
                    }}
                    onFocus={() => handleFocus("dl-desired-date")}
                    onKeyDown={(e) => handleKeyDown(e, "dl-desired-date", "date", handleDesiredDatePrev, handleDesiredDateNext)}
                  />
                </div>
              </label>

              <label className="field apple-field">
                <span className="apple-field-label">
                  <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                  <span>预计完成时间</span>
                </span>
                <div className="deadline-time-with-clear">
                  <div className="apple-input-wrapper">
                    <input
                      ref={desiredTimeRef}
                      aria-label="预计完成时间"
                      type="time"
                      value={desiredTime}
                      onChange={(event) => {
                        const nextTime = event.target.value;
                        const targetDate = desiredDate || date;
                        onDesiredAtChange(nextTime && targetDate ? `${targetDate}T${nextTime}` : "");
                      }}
                      onFocus={() => handleFocus("dl-desired-time")}
                      onKeyDown={(e) => handleKeyDown(e, "dl-desired-time", "time", handleDesiredTimePrev, undefined)}
                    />
                  </div>
                  <button
                    type="button"
                    className="deadline-desired-remove"
                    title="移除预计完成时间"
                    aria-label="移除预计完成时间"
                    onClick={() => {
                      onDirty();
                      onDesiredAtChange("");
                    }}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </label>
            </div>
          ) : (
            <button
              type="button"
              className="deadline-desired-add-btn"
              onClick={() => {
                onDirty();
                onDesiredAtChange(`${date || "2026-09-27"}T${startTime || "18:00"}`);
              }}
            >
              <Plus size={14} aria-hidden="true" />
              <span>设定预计完成时间 (可选)</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="task-editor-section task-schedule-column is-task">
      {/* Apple Date & Time + Toggles Container */}
      <div className="apple-datetime-card">
        <div className="apple-datetime-row">
          <div className={`task-date-repeat-row ${isDeadline ? "is-deadline" : ""}`}>
            <div className="field task-date-field apple-field">
              <div className="apple-field-header">
                <span className="apple-field-label">
                  <Calendar size={14} className="apple-field-icon" aria-hidden="true" />
                  <span>{isDeadline ? "实际截止日期" : "日期"}</span>
                </span>
              </div>
              <div className="apple-input-wrapper">
                <input
                  ref={taskDateRef}
                  aria-label={isDeadline ? "实际截止日期" : "日期"}
                  type="date"
                  value={date}
                  onChange={(event) => onDateChange(event.target.value)}
                  onFocus={() => handleFocus("task-date")}
                  onKeyDown={(e) => handleKeyDown(e, "task-date", "date", undefined, handleTaskDateNext)}
                />
              </div>
            </div>
          </div>
          <div
            className={`task-time-entry-row ${isDeadline ? "is-deadline" : hasTime ? "has-time" : "is-overridden"}`}
          >
            <div className={`field task-start-field apple-field ${!hasTime && !isDeadline ? "is-overridden" : ""}`}>
              <div className="apple-field-header">
                <span className="apple-field-label">
                  <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                  <span>{isDeadline ? "截止时间" : "开始时间"}</span>
                </span>
              </div>
              <div className="apple-input-wrapper">
                <input
                  ref={taskStartRef}
                  type="time"
                  required={isDeadline || hasTime}
                  value={isDeadline || hasTime ? startTime : ""}
                  aria-label={!isDeadline && !hasTime ? "选择开始时间" : undefined}
                  onClick={activateTimedMode}
                  onChange={(event) => {
                    activateTimedMode();
                    onStartTimeChange(event.target.value);
                  }}
                  onFocus={() => handleFocus("task-start")}
                  onKeyDown={(e) => handleKeyDown(e, "task-start", "time", () => taskDateRef.current?.focus(), handleTaskStartNext)}
                />
              </div>
            </div>
            {!isDeadline && hasTime ? (
              <div className={`task-end-time-control apple-field ${duration === "custom" ? "has-end" : ""}`}>
                {duration === "custom" ? (
                  <div className="field task-end-time-field">
                    <div className="apple-field-header">
                      <span className="apple-field-label">
                        <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                        <span>结束时间</span>
                      </span>
                      <button
                        className="task-time-end-remove"
                        type="button"
                        aria-label="移除结束时间"
                        title="移除结束时间"
                        onClick={() => {
                          onDirty();
                          onDurationChange("none");
                        }}
                      >
                        <X size={13} aria-hidden="true" />
                        <span>移除</span>
                      </button>
                    </div>
                    <div className={`task-end-time-input-shell apple-input-wrapper ${startTime === endTime ? "is-invalid" : ""}`}>
                      <input
                        ref={taskEndRef}
                        type="time"
                        required
                        value={endTime}
                        aria-label="结束时间"
                        aria-invalid={startTime === endTime}
                        aria-describedby={startTime === endTime ? "task-end-time-error" : undefined}
                        onChange={(event) => {
                          onDirty();
                          onEndTimeChange(event.target.value);
                          onDurationChange("custom");
                        }}
                        onFocus={() => handleFocus("task-end")}
                        onKeyDown={(e) => handleKeyDown(e, "task-end", "time", handleTaskEndPrev, undefined)}
                      />
                    </div>
                    {startTime === endTime ? (
                      <small id="task-end-time-error" className="field-error">结束时间不能与开始时间相同。</small>
                    ) : null}
                  </div>
                ) : (
                  <div className="apple-add-end-wrapper">
                    <div className="apple-field-header">
                      <span className="apple-field-label">
                        <Clock size={14} className="apple-field-icon" aria-hidden="true" />
                        <span>结束时间</span>
                      </span>
                    </div>
                    <button
                      className="task-time-end-add apple-add-end-btn"
                      type="button"
                      onClick={() => {
                        onDirty();
                        onDurationChange("custom");
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>添加结束时间</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {!isDeadline ? (
          <div className="apple-toggles-container">
            <div className="task-schedule-overrides" role="group" aria-label="时间安排">
              {([
                ["all-day", "全天"],
                ["unscheduled", "待安排"],
                ["morning", "仅上午"],
                ["afternoon", "仅下午"],
                ["evening", "仅晚上"],
              ] as const).map(([mode, label]) => {
                const icon = mode === "all-day" ? "☀️" : mode === "unscheduled" ? "💭" : mode === "morning" ? "🌅" : mode === "afternoon" ? "🌇" : "🌙";
                const active = scheduleMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`apple-toggle-pill ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => selectScheduleOverride(mode)}
                  >
                    <span className="apple-toggle-icon" aria-hidden="true">{icon}</span>
                    <span className="apple-toggle-text">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}


export function formatScheduleDate(dateStr: string): string {
  if (!dateStr) return "请选择日期";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const weekday = weekdays[dateObj.getDay()];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    if (dateStr === todayKey) {
      return `${m}月${d}日 (${weekday} · 今天)`;
    }
    if (dateStr === tomorrowKey) {
      return `${m}月${d}日 (${weekday} · 明天)`;
    }
    if (y !== today.getFullYear()) {
      return `${y}年${m}月${d}日 (${weekday})`;
    }
    return `${m}月${d}日 (${weekday})`;
  } catch {
    return dateStr;
  }
}
