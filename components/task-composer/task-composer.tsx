"use client";

import "./task-composer.css";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Trash2, X } from "lucide-react";
import { RRule, rrulestr } from "rrule";
import {
  fromDateTimeLocal,
  isTaskOccurrenceCompleted,
  courseWeekdayForDate,
  firstCourseDateOnOrAfter,
  localDateKey,
  makeCourseRecurrenceRule,
  MORANDI_COLORS,
  parseRepeatPreset,
  recurrenceWeekdays,
  toDateTimeLocal,
  type CalendarEvent,
  type PlannerTask,
} from "@/lib/domain";
import { usePlanner } from "../planner-provider";
import { InspectorShell } from "../composer-shell";
import { makeCustomRepeatRule, makeRules, type RepeatPreset } from "../composer-shared";
import { ComposerActions } from "./actions";
import { TaskOrganizationSection, TaskScheduleSection, TaskTitleSection } from "./sections";

type TaskScheduleMode = "timed" | "unscheduled" | "all-day" | "morning" | "afternoon" | "evening";

function restoreRepeatDraft(
  rule?: string | null,
  startAt?: string | null,
): {
  preset: RepeatPreset;
  interval: string;
  unit: "daily" | "weekly" | "monthly";
  weekdays: number[];
} {
  if (!rule) return { preset: "none", interval: "1", unit: "weekly", weekdays: [] };
  try {
    const options = rrulestr(rule).options;
    const interval = String(options.interval ?? 1);
    const weekdays = recurrenceWeekdays(rule, startAt);
    if (options.freq === RRule.DAILY && interval === "1") return { preset: "daily", interval, unit: "daily", weekdays: [] };
    if (options.freq === RRule.WEEKLY && interval === "1" && weekdays.length === 5 && weekdays.every((day) => day >= 0 && day <= 4)) return { preset: "weekdays", interval, unit: "weekly", weekdays };
    if (options.freq === RRule.WEEKLY && interval === "1") return { preset: "weekly", interval, unit: "weekly", weekdays };
    if (options.freq === RRule.MONTHLY && interval === "1") return { preset: "monthly", interval, unit: "monthly", weekdays: [] };
    const unit = options.freq === RRule.DAILY ? "daily" : options.freq === RRule.MONTHLY ? "monthly" : "weekly";
    return { preset: "custom", interval, unit, weekdays };
  } catch {
    return { preset: "custom", interval: "1", unit: "weekly", weekdays: [] };
  }
}

function clockAfterMinutes(clock: string, minutes: number): string {
  const [hours, currentMinutes] = clock.split(":").map(Number);
  const total = (hours * 60 + currentMinutes + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function minutesBetweenClockTimes(start: string, end: string): number | null {
  if (!start || !end || start === end) return null;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes < 0) minutes += 24 * 60;
  return minutes || null;
}

export function TaskComposer({
  open,
  task,
  occurrenceAt,
  courseEvent,
  courseOccurrenceAt,
  defaultDate,
  defaultTime = false,
  prefillDraftDate = false,
  onQuickAdd,
  onClose,
}: {
  open: boolean;
  task?: PlannerTask | null;
  occurrenceAt?: string;
  courseEvent?: CalendarEvent | null;
  courseOccurrenceAt?: string;
  defaultDate?: Date;
  defaultTime?: boolean;
  prefillDraftDate?: boolean;
  onQuickAdd?: (date: Date) => void;
  onClose: () => void;
}) {
  const {
    addTask,
    addEvent,
    updateTask,
    toggleTask,
    tasks,
    updateEvent,
    deleteTask,
    deleteEvent,
    thoughts,
    settings,
    saveSettings,
    removeItemType,
  } = usePlanner();
  const originIds = courseEvent?.originThoughtIds ?? task?.originThoughtIds;
  const origins = (originIds ?? [])
    .map((id) => thoughts.find((thought) => thought.id === id))
    .filter((thought): thought is NonNullable<typeof thought> => Boolean(thought));
  const [title, setTitle] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<
    NonNullable<PlannerTask["assignmentStatus"]>
  >("todo");
  const [date, setDate] = useState("");
  const [scheduleMode, setScheduleMode] = useState<TaskScheduleMode>("timed");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [recurrenceEndAt, setRecurrenceEndAt] = useState("");
  const [desiredAt, setDesiredAt] = useState("");
  const [duration, setDuration] = useState("");
  const [timePreference, setTimePreference] = useState<"none" | "continuous" | "fragment">("none");
  const [notes, setNotes] = useState("");
  const [repeat, setRepeat] = useState<RepeatPreset>("none");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUnit, setRepeatUnit] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [itemTypeId, setItemTypeId] = useState("research");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState<string>("#D7A6A1");
  const [showTypeCreator, setShowTypeCreator] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 47.9375rem)").matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 47.9375rem)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const initializedTaskDraftRef = useRef<string | null>(null);
  const currentTask = task ? tasks.find((item) => item.id === task.id) ?? task : null;
  const completionOccurrenceAt = occurrenceAt ?? task?.scheduledStartAt ?? task?.actualDeadlineAt ?? task?.dueAt ?? new Date().toISOString();
  const taskCompleted = currentTask
    ? currentTask.recurrenceRule
      ? isTaskOccurrenceCompleted(currentTask, completionOccurrenceAt)
      : currentTask.status === "completed"
    : false;
  const taskFailed = currentTask ? currentTask.status === "failed" : false;

  useEffect(() => {
    if (!open) {
      initializedTaskDraftRef.current = null;
      return;
    }
    const draftIdentity = (courseEvent ? `${courseEvent.id}:${courseOccurrenceAt ?? ""}` : null) ?? (task ? `${task.id}:${occurrenceAt ?? ""}` : "new-task");
    if (initializedTaskDraftRef.current === draftIdentity) return;
    initializedTaskDraftRef.current = draftIdentity;
    setTitle(courseEvent?.title ?? task?.title ?? "");
    setAssignmentStatus(task?.assignmentStatus ?? "todo");
    const now = new Date();
    const existingDeadlineAt = task?.taskKind === "assignment"
      ? task.actualDeadlineAt ?? task.scheduledStartAt ?? task.dueAt
      : null;
    const dateSource =
      occurrenceAt ??
      courseEvent?.startAt ??
      existingDeadlineAt ??
      task?.dueAt ??
      task?.scheduledStartAt ??
      defaultDate?.toISOString() ??
      now.toISOString();
    const defaultDateKey = localDateKey(new Date(dateSource));
    const defaultDateTime = toDateTimeLocal(now.toISOString());
    const currentTime = defaultDateTime.slice(11, 16);
    setDate(defaultDateKey);
    const nextIsAllDay =
      !courseEvent && task?.taskKind !== "assignment" && Boolean(task?.isAllDay);
    const nextHasTime = !nextIsAllDay && (
      Boolean(courseEvent) ||
      Boolean(existingDeadlineAt) ||
      Boolean(task?.scheduledStartAt) ||
      !task
    );
    const nextStartTime =
      courseEvent
        ? toDateTimeLocal(courseOccurrenceAt ?? courseEvent.startAt).slice(11, 16)
        : occurrenceAt && (existingDeadlineAt || task?.scheduledStartAt)
        ? toDateTimeLocal(occurrenceAt).slice(11, 16)
        : existingDeadlineAt
        ? toDateTimeLocal(existingDeadlineAt).slice(11, 16)
        : task?.scheduledStartAt
        ? toDateTimeLocal(task.scheduledStartAt).slice(11, 16)
        : defaultDate && defaultTime
          ? `${String(defaultDate.getHours()).padStart(2, "0")}:${String(defaultDate.getMinutes()).padStart(2, "0")}`
          : currentTime;
    const nextDuration = courseEvent
      ? Math.max(1, Math.round((new Date(courseEvent.endAt).getTime() - new Date(courseEvent.startAt).getTime()) / 60_000))
      : task?.taskKind === "assignment"
        ? null
        : task?.scheduledStartAt
          ? task.durationMinutes
          : 60;
    const computedEndTime =
      courseEvent?.endAt
        ? toDateTimeLocal(courseEvent.endAt).slice(11, 16)
        : clockAfterMinutes(nextStartTime, nextDuration ?? 60);
    const initialMode: TaskScheduleMode = nextIsAllDay
      ? "all-day"
      : nextHasTime
      ? nextStartTime === "09:00" && computedEndTime === "12:00"
        ? "morning"
        : nextStartTime === "12:00" && computedEndTime === "18:00"
        ? "afternoon"
        : nextStartTime === "18:00" && computedEndTime === "22:00"
        ? "evening"
        : "timed"
      : "unscheduled";
    setScheduleMode(initialMode);
    setStartTime(nextStartTime);
    setEndTime(computedEndTime);
    setLocation(courseEvent?.location ?? "");
    const initialRecurrenceEnd = courseEvent
      ? courseEvent.recurrenceEndAt?.slice(0, 10) ?? defaultDateKey
      : task?.recurrenceRule
      ? (() => {
          try {
            const until = rrulestr(task.recurrenceRule).options.until;
            return until ? localDateKey(until) : "";
          } catch {
            return "";
          }
        })()
      : "";
    setRecurrenceEndAt(initialRecurrenceEnd);
    setDesiredAt(toDateTimeLocal(task?.desiredCompletionAt ?? null) || "");
    setDuration(nextDuration == null ? "none" : "custom");
    setTimePreference(task?.needsContinuousTime ? "continuous" : task?.isFragmentFriendly ? "fragment" : "none");
    setNotes(task?.notes ?? "");
    const repeatDraft = restoreRepeatDraft(
      courseEvent?.recurrenceRule ?? task?.recurrenceRule,
      courseEvent?.startAt ?? task?.actualDeadlineAt ?? task?.scheduledStartAt ?? (task?.dueAt ? fromDateTimeLocal(`${task.dueAt.slice(0, 10)}T12:00`) : null),
    );
    setRepeat(repeatDraft.preset);
    setRepeatInterval(repeatDraft.interval);
    setRepeatUnit(repeatDraft.unit);
    setRepeatWeekdays(repeatDraft.weekdays);
    setReminders((courseEvent?.reminderRules ?? task?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
    setItemTypeId(
      courseEvent
        ? "course"
        : task?.taskKind === "assignment"
        ? "deadline"
        : task?.itemTypeId ?? settings.itemTypes[0]?.id ?? "research",
    );
    setNewTypeName("");
    setNewTypeColor(MORANDI_COLORS[settings.itemTypes.length % MORANDI_COLORS.length]);
    setShowTypeCreator(false);
    setDirty(false);
    setSaveError("");
    setSubmitAttempted(false);
  }, [courseEvent, courseOccurrenceAt, defaultDate, defaultTime, occurrenceAt, open, prefillDraftDate, settings.itemTypes, task]);

  const selectedType =
    settings.itemTypes.find((type) => type.id === itemTypeId) ?? settings.itemTypes[0];
  const hasTime = scheduleMode === "timed" || scheduleMode === "morning" || scheduleMode === "afternoon" || scheduleMode === "evening";
  const isAllDay = scheduleMode === "all-day";
  const isDeadline =
    itemTypeId === "deadline" || selectedType?.name.trim().toLowerCase() === "deadline";
  const isCourse = Boolean(courseEvent) || (!task && itemTypeId === "course");
  const courseFirstDate = isCourse
    ? firstCourseDateOnOrAfter(date, repeatWeekdays)
    : "";
  const courseReady = Boolean(
    date &&
      recurrenceEndAt &&
      courseFirstDate &&
      recurrenceEndAt >= courseFirstDate &&
      repeatWeekdays.length &&
      startTime &&
      endTime &&
      startTime !== endTime,
  );
  const customDurationMinutes = duration === "custom"
    ? minutesBetweenClockTimes(startTime, endTime)
    : null;
  const effectiveDuration = !isDeadline && duration === "custom"
    ? customDurationMinutes
    : null;
  const taskScheduleReady = isDeadline
    ? Boolean(date && startTime)
    : !hasTime || Boolean(startTime && (duration === "none" || effectiveDuration));
  const repeatSummary = repeat === "none"
    ? ""
    : repeat === "daily"
      ? "每天重复"
      : repeat === "weekdays"
        ? "每个工作日重复"
        : repeat === "weekly"
          ? repeatWeekdays.length
            ? `每周（周${repeatWeekdays.slice().sort((a, b) => a - b).map((day) => ["一", "二", "三", "四", "五", "六", "日"][day]).join("、")}）重复`
            : "每周重复"
          : repeat === "monthly"
            ? "每月重复"
            : `每 ${repeatInterval || 1} ${repeatUnit === "daily" ? "天" : repeatUnit === "weekly" ? "周" : "月"}${repeatUnit === "weekly" && repeatWeekdays.length ? `（周${repeatWeekdays.map((day) => ["一", "二", "三", "四", "五", "六", "日"][day]).join("、")}）` : ""}重复`;

  function canLeave() {
    return !saving && (!dirty || window.confirm("有尚未保存的修改，确定要离开吗？"));
  }

  function requestClose() {
    if (canLeave()) onClose();
  }

  async function changeCompletion() {
    if (!currentTask || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      if (currentTask.status === "failed") {
        await updateTask(currentTask.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          assignmentStatus:
            currentTask.taskKind === "assignment" ? "submitted" : currentTask.assignmentStatus,
        });
        if (currentTask.taskKind === "assignment" && !currentTask.recurrenceRule) {
          setAssignmentStatus("submitted");
        }
      } else {
        await toggleTask(currentTask.id, completionOccurrenceAt);
        if (currentTask.taskKind === "assignment" && !currentTask.recurrenceRule) {
          setAssignmentStatus(taskCompleted ? "todo" : "submitted");
        }
      }
    } catch {
      setSaveError("完成状态更新失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function changeFailStatus() {
    if (!currentTask || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const nextStatus = taskFailed ? "open" : "failed";
      await updateTask(currentTask.id, {
        status: nextStatus,
        completedAt: null,
      });
      if (currentTask.taskKind === "assignment" && !currentTask.recurrenceRule) {
        setAssignmentStatus("todo");
      }
    } catch {
      setSaveError("失败状态更新失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomType(typeId: string) {
    try {
      await removeItemType(typeId);
      setDirty(true);
      if (itemTypeId === typeId) setItemTypeId("research");
    } catch {
      setSaveError("类型删除失败，请稍后重试。");
    }
  }

  async function createCustomType() {
    const name = newTypeName.trim();
    if (!name) return;
    const id = `type_${Date.now().toString(36)}`;
    try {
      await saveSettings({ itemTypes: [...settings.itemTypes, { id, name, color: newTypeColor }] });
      setDirty(true);
      setItemTypeId(id);
      setNewTypeName("");
      setNewTypeColor("#D7A6A1");
      setShowTypeCreator(false);
    } catch {
      setSaveError("类型创建失败，请稍后重试。");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSubmitAttempted(true);
    if (!title.trim()) return;
    if (!taskScheduleReady) {
      setSaveError(
        isDeadline
          ? "请填写实际截止日期和截止时间。"
          : duration === "custom"
            ? "请填写有效的开始时间和结束时间。"
            : "请填写开始时间。",
      );
      return;
    }
    if (isCourse && !courseReady) {
      setSaveError("请完整填写学期起止日期、每周上课日和上课时段。");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const scheduledDate = isCourse ? courseFirstDate : date;
      const scheduledIso = hasTime && !isAllDay && scheduledDate
        ? fromDateTimeLocal(`${scheduledDate}T${startTime}`)
        : null;
      const dayEndIso = date ? fromDateTimeLocal(`${date}T23:59`) : null;
      const actualDeadlineIso = isDeadline ? scheduledIso : null;
      const repeatAnchorIso = isDeadline
        ? actualDeadlineIso
        : hasTime && !isAllDay && scheduledDate
          ? scheduledIso
          : date
            ? fromDateTimeLocal(`${date}T12:00`)
            : null;
      if (isDeadline && !actualDeadlineIso) {
        setSaveError("请填写实际截止日期和截止时间。");
        return;
      }
      if (isCourse && scheduledIso) {
        const courseEndIso = fromDateTimeLocal(`${scheduledDate}T${endTime}`);
        if (!courseEndIso) return;
        let end = new Date(courseEndIso);
        if (end.getTime() <= new Date(scheduledIso).getTime()) {
          end = new Date(end.getTime() + 24 * 60 * 60_000);
        }
        const coursePatch = {
          title,
          eventKind: "course" as const,
          startAt: scheduledIso,
          endAt: end.toISOString(),
          timezone: settings.timezone,
          recurrenceRule: makeCourseRecurrenceRule(
            scheduledIso,
            repeatWeekdays,
            recurrenceEndAt,
          ),
          recurrenceEndAt: recurrenceEndAt || null,
          notes: "",
          location: location.trim() || null,
          itemTypeId: "course",
          colorOverride: null,
          reminderOffsetMinutes: reminders[0] ?? null,
          reminderRules: makeRules(reminders, "start"),
        };
        if (courseEvent) await updateEvent(courseEvent.id, coursePatch);
        else await addEvent(coursePatch);
        onClose();
        return;
      }
      const taskKind = isDeadline ? ("assignment" as const) : ("ordinary" as const);
      const reminderRules = makeRules(reminders, isDeadline ? "deadline" : "start");
      const patch = {
        title,
        status: isDeadline && assignmentStatus === "submitted" ? ("completed" as const) : ("open" as const),
        planningState: date ? ("planned" as const) : ("draft" as const),
        taskKind,
        notes,
        dueAt: isDeadline ? actualDeadlineIso : dayEndIso,
        desiredCompletionAt: isDeadline ? fromDateTimeLocal(desiredAt) : null,
        actualDeadlineAt: actualDeadlineIso,
        assignmentStatus: isDeadline ? assignmentStatus : null,
        scheduledStartAt: isDeadline ? null : scheduledIso,
        isAllDay: isDeadline ? false : !isCourse && isAllDay,
        itemTypeId,
        colorOverride: task?.colorOverride ?? null,
        durationMinutes: isDeadline ? null : hasTime && !isAllDay ? effectiveDuration : null,
        needsContinuousTime: !isAllDay && !hasTime && timePreference === "continuous",
        isFragmentFriendly: !isAllDay && !hasTime && timePreference === "fragment",
        recurrenceRule: repeat === "custom"
          ? makeCustomRepeatRule(
              repeatUnit,
              Number(repeatInterval) || 1,
              repeatWeekdays,
              repeatAnchorIso,
              recurrenceEndAt,
            )
          : repeat === "weekly" && repeatWeekdays.length
            ? makeCustomRepeatRule(
                "weekly",
                1,
                repeatWeekdays,
                repeatAnchorIso,
                recurrenceEndAt,
              )
            : parseRepeatPreset(
                repeat,
                repeatAnchorIso,
                recurrenceEndAt,
              ),
        reminderOffsetMinutes: reminders[0] ?? null,
        reminderRules,
      };
      if (task?.id) {
        const nextStatus = isDeadline && assignmentStatus === "submitted" && !currentTask?.recurrenceRule
          ? "completed"
          : currentTask?.status ?? task.status;
        await updateTask(task.id, {
          ...patch,
          status: nextStatus,
          completedAt: nextStatus === "completed" ? currentTask?.completedAt ?? new Date().toISOString() : currentTask?.completedAt ?? null,
        });
      } else {
        await addTask(patch);
      }
      onClose();
    } catch {
      setSaveError("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <InspectorShell
      title={courseEvent ? "编辑课程" : task?.id ? "编辑事项" : isCourse ? "新增课程" : "新增事项"}
      panelClassName="task-composer-inspector"
      backdropClassName="task-composer-backdrop"
      onClose={requestClose}
      headerLeading={
        isMobile ? (
          <button
            type="button"
            className="composer-mobile-header-cancel"
            onClick={requestClose}
          >
            取消
          </button>
        ) : undefined
      }
      headerTrailing={
        isMobile ? (
          <>
            {(courseEvent || task?.id) ? (
              <button
                type="button"
                className="composer-mobile-header-delete"
                title={courseEvent?.recurrenceRule && courseOccurrenceAt ? "删除本次课程" : isCourse ? "删除课程" : "删除事项"}
                aria-label={courseEvent?.recurrenceRule && courseOccurrenceAt ? "删除本次课程" : isCourse ? "删除课程" : "删除事项"}
                onClick={async () => {
                  if (courseEvent) {
                    if (courseEvent.recurrenceRule && courseOccurrenceAt) {
                      const occurrenceKey = localDateKey(new Date(courseOccurrenceAt));
                      await updateEvent(courseEvent.id, {
                        excludedOccurrenceKeys: Array.from(new Set([...(courseEvent.excludedOccurrenceKeys ?? []), occurrenceKey])),
                      });
                    } else {
                      await deleteEvent(courseEvent.id);
                    }
                  } else if (task?.id) {
                    await deleteTask(task.id);
                  }
                  onClose();
                }}
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="submit"
              form="task-composer-form"
              disabled={saving || (!dirty && Boolean(task?.id)) || !title.trim() || !taskScheduleReady || (isCourse && !courseReady)}
              className="composer-mobile-header-save"
            >
              {saving ? "保存中" : "保存"}
            </button>
          </>
        ) : undefined
      }
    >
      <form
        id="task-composer-form"
        className={`composer-form task-composer-form ${isCourse ? "is-course" : ""}`}
        onSubmit={submit}
        onChange={() => setDirty(true)}
      >
        <TaskTitleSection
          title={title}
          isCourse={isCourse}
          isDeadline={isDeadline}
          autoFocus={!isMobile && !task && !courseEvent}
          showError={submitAttempted && !title.trim()}
          onTitleChange={setTitle}
          failAction={
            task && !isCourse ? (
              <button
                className={`task-fail-action secondary-button ${taskFailed ? "is-failed" : ""}`}
                type="button"
                disabled={saving}
                aria-pressed={taskFailed}
                title={taskFailed ? "恢复为待办" : "标记为失败"}
                aria-label={taskFailed ? "恢复为待办" : "标记为失败"}
                onClick={() => void changeFailStatus()}
              >
                <X size={isMobile ? 16 : 15} aria-hidden="true" />
              </button>
            ) : null
          }
        >
          {task && !isCourse ? (
            <button
              className={`task-completion-action secondary-button ${taskCompleted ? "is-completed" : ""}`}
              type="button"
              disabled={saving}
              aria-pressed={taskCompleted}
              title={taskCompleted ? (task.recurrenceRule ? "取消完成（本次）" : "取消完成") : (task.recurrenceRule ? "标记完成（本次）" : "标记完成")}
              aria-label={taskCompleted ? (task.recurrenceRule ? "取消完成（本次）" : "取消完成") : (task.recurrenceRule ? "标记完成（本次）" : "标记完成")}
              onClick={() => void changeCompletion()}
            >
              <Check size={isMobile ? 16 : 15} aria-hidden="true" />
            </button>
          ) : null}
        </TaskTitleSection>
        <div className="task-editor-scroll">
          <div className="task-editor-columns">
            <TaskScheduleSection
              isMobile={isMobile}
              isCourse={isCourse}
              isDeadline={isDeadline}
              date={date}
              courseFirstDate={courseFirstDate}
              scheduleMode={scheduleMode}
              location={location}
              startTime={startTime}
              endTime={endTime}
              duration={duration}
              desiredAt={desiredAt}
              repeatWeekdays={repeatWeekdays}
              recurrenceEndAt={recurrenceEndAt}
              onDateChange={setDate}
              onScheduleModeChange={(value) => {
                setScheduleMode(value);
                setTimePreference("none");
              }}
              onLocationChange={setLocation}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onDurationChange={setDuration}
              onDesiredAtChange={setDesiredAt}
              onRepeatWeekdaysChange={setRepeatWeekdays}
              onRecurrenceEndAtChange={setRecurrenceEndAt}
              onDirty={() => setDirty(true)}
            />
            <TaskOrganizationSection
              key={open ? (task ? `edit-${task.id}` : "new") : "closed"}
              isMobile={isMobile}
              date={date}
              itemTypes={settings.itemTypes}
              editingTask={Boolean(task?.id)}
              itemTypeId={itemTypeId}
              newTypeName={newTypeName}
              newTypeColor={newTypeColor}
              showTypeCreator={showTypeCreator}
              isCourse={isCourse}
              isDeadline={isDeadline}
              hasTime={hasTime}
              isAllDay={isAllDay}
              timePreference={timePreference}
              assignmentStatus={assignmentStatus}
              repeat={repeat}
              repeatInterval={repeatInterval}
              repeatUnit={repeatUnit}
              repeatWeekdays={repeatWeekdays}
              recurrenceEndAt={recurrenceEndAt}
              repeatSummary={repeatSummary}
              reminders={reminders}
              notes={notes}
              origins={origins}
              onItemTypeChange={(value) => {
                setItemTypeId(value);
                const nextType = settings.itemTypes.find((type) => type.id === value);
                const nextIsDeadline =
                  value === "deadline" || nextType?.name.trim().toLowerCase() === "deadline";
                if (nextIsDeadline) {
                  setScheduleMode("timed");
                  setDuration("none");
                  setTimePreference("none");
                } else if (isDeadline) {
                  setDuration("custom");
                  setEndTime((current) => current || clockAfterMinutes(startTime, 60));
                }
              }}
              onNewTypeNameChange={setNewTypeName}
              onNewTypeColorChange={setNewTypeColor}
              onShowTypeCreatorChange={setShowTypeCreator}
              onRemoveCustomType={removeCustomType}
              onCreateCustomType={createCustomType}
              onCourseSelected={() => {
                setScheduleMode("timed");
                setTimePreference("none");
                setRepeat("weekly");
                if (!repeatWeekdays.length && date) {
                  setRepeatWeekdays([courseWeekdayForDate(date)]);
                }
              }}
              onAssignmentStatusChange={setAssignmentStatus}
              onRepeatChange={(preset) => {
                setRepeat(preset);
                if (preset === "weekly" && !repeatWeekdays.length && date) {
                  setRepeatWeekdays([courseWeekdayForDate(date)]);
                }
              }}
              onRepeatIntervalChange={setRepeatInterval}
              onRepeatUnitChange={setRepeatUnit}
              onRepeatWeekdaysChange={setRepeatWeekdays}
              onRecurrenceEndAtChange={setRecurrenceEndAt}
              onRemindersChange={(values) => {
                setDirty(true);
                setReminders(values);
              }}
              onNotesChange={setNotes}
              onDirty={() => setDirty(true)}
            />
          </div>
        </div>
        {saveError ? <p className="task-save-error" role="alert">{saveError}</p> : null}
        {!isMobile ? (
          <ComposerActions
            saving={saving}
            enabled={dirty && Boolean(title.trim()) && taskScheduleReady && (!isCourse || courseReady)}
            onClose={requestClose}
            label={isCourse ? "保存课程" : "保存事项"}
            deleteLabel={courseEvent?.recurrenceRule && courseOccurrenceAt ? "删除本次课程" : undefined}
            onDelete={
              courseEvent
                ? async () => {
                    if (courseEvent.recurrenceRule && courseOccurrenceAt) {
                      const occurrenceKey = localDateKey(new Date(courseOccurrenceAt));
                      await updateEvent(courseEvent.id, {
                        excludedOccurrenceKeys: Array.from(new Set([...(courseEvent.excludedOccurrenceKeys ?? []), occurrenceKey])),
                      });
                    } else {
                      await deleteEvent(courseEvent.id);
                    }
                    onClose();
                  }
                : task
                ? async () => {
                    await deleteTask(task.id);
                    onClose();
                  }
                : undefined
            }
          />
        ) : null}
      </form>
    </InspectorShell>
  );
}
