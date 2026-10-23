"use client";

import "./today.css";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Eye, EyeOff, Plus, StickyNote } from "lucide-react";
import { useAppNavigation } from "../../app-navigation";
import { usePlanner } from "../../planner-provider";
import {
  EventComposer,
  ScheduleBlockComposer,
  TaskComposer,
} from "../../composers";
import {
  TodayCompletionChoice,
  TodayScheduleSection,
  TodaySummaryCards,
} from "./today-sections";
import {
  eventOccurrenceOnDay,
  isExamItem,
  localDateKey,
  startOfLocalDay,
  taskOccurrenceOnDay,
  taskOccurrencesOnDay,
  type CalendarEvent,
  type PlannerTask,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import { useTodayModel } from "./today-model";
import { CalendarQuickAdd } from "../calendar/calendar-quick-add";
import type { QuickTaskRow } from "../calendar/calendar-quick-add-model";

function formatHeaderDate(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdays[d.getDay()];
  return `${year} 年 ${month} 月 ${day} 日 · ${weekday}`;
}

function formatMobileDate(d: Date) {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${month}月${day}日 · ${weekdays[d.getDay()]}`;
}

function getWeekDays(anchor: Date) {
  const current = startOfLocalDay(anchor);
  const day = current.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const selectedKey = localDateKey(anchor);
  const todayKey = localDateKey(new Date());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = localDateKey(d);
    return {
      date: d,
      dateKey,
      dayNumber: d.getDate(),
      weekdayName: weekdays[i],
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
    };
  });
}

export function TodayView({
  defaultInboxExpanded = false,
}: {
  defaultInboxExpanded?: boolean;
} = {}) {
  const planner = usePlanner();
  const { navigate } = useAppNavigation();
  const {
    tasks,
    events,
    thoughts,
    goals,
    projects,
    projectNodes,
    scheduleBlocks,
    settings,
    completeScheduleBlock,
    toggleTask,
    updateEvent,
    updateScheduleBlock,
    deleteTask,
    deleteProjectNode,
    addThought,
    updateThoughtStatus,
    convertThoughtToDraft,
    addGoal,
    addProject,
    addTasks,
  } = planner;
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [editingTaskOccurrenceAt, setEditingTaskOccurrenceAt] = useState<string | undefined>();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [blockSource, setBlockSource] = useState<PlannerTask | ProjectNode | null>(null);
  const [completionBlock, setCompletionBlock] = useState<ScheduleBlock | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDraft, setQuickAddDraft] = useState<QuickTaskRow[] | undefined>();
  const [hideCourses, setHideCourses] = useState(true);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const {
    targetDate,
    targetDateKey,
    allDay,
    untimed,
    timed,
    assignments,
    inboxThoughts,
  } = useTodayModel({ tasks, events, thoughts, goals, projects, projectNodes, scheduleBlocks, settings, now: selectedDate, advanceTab: "all", hideCourses });

  const mobileWeekDays = useMemo(() => {
    return getWeekDays(selectedDate).map((day) => {
      const hasExam =
        events.some((e) => {
          if (!isExamItem(e, settings.itemTypes)) return false;
          return Boolean(eventOccurrenceOnDay(e, day.date));
        }) ||
        tasks.some((t) => {
          if (!isExamItem(t, settings.itemTypes)) return false;
          return taskOccurrencesOnDay(t, day.date).length > 0;
        });
      return { ...day, hasExam };
    });
  }, [selectedDate, events, tasks, settings.itemTypes]);

  const isSelectedToday = localDateKey(selectedDate) === localDateKey(new Date());

  async function completeBlock(block: ScheduleBlock) {
    if (block.status === "performed") {
      await updateScheduleBlock(block.id, { status: "planned" });
      return;
    }
    const count = scheduleBlocks.filter(
      (candidate) =>
        candidate.sourceType === block.sourceType &&
        candidate.sourceId === block.sourceId &&
        candidate.status === "planned",
    ).length;
    if (count > 1) setCompletionBlock(block);
    else await completeScheduleBlock(block.id, "item");
  }

  function openBlock(block: ScheduleBlock) {
    const source =
      block.sourceType === "task"
        ? tasks.find((task) => task.id === block.sourceId) ?? null
        : projectNodes.find((node) => node.id === block.sourceId) ?? null;
    setBlockSource(source);
    setEditingBlock(block);
  }

  // Deletion helper retaining domain deletion capabilities
  async function handleDeleteSource(source: PlannerTask | ProjectNode) {
    try {
      if (source.entityType === "task") await deleteTask(source.id);
      else await deleteProjectNode(source.id);
      setNotice("事项已删除");
    } catch {
      setNotice("删除失败，请重试。");
    }
  }

  return (
    <>
      {/* 顶部工具与日期栏 */}
      <header className="today-header-bar">
        <div className="today-header-left">
          <h1 className="today-header-date">{formatHeaderDate(selectedDate)}</h1>
          <div className="today-header-nav">
            <button
              type="button"
              className="today-nav-btn today-nav-arrow"
              onClick={() => setSelectedDate((d) => new Date(d.getTime() - 24 * 60 * 60 * 1000))}
              aria-label="前一天"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="today-nav-btn"
              onClick={() => setSelectedDate(new Date())}
            >
              今天
            </button>
            <button
              type="button"
              className="today-nav-btn today-nav-arrow"
              onClick={() => setSelectedDate((d) => new Date(d.getTime() + 24 * 60 * 60 * 1000))}
              aria-label="后一天"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="today-header-right">
          <label className="today-course-switch-wrap" title="切换课程表显示">
            <input
              type="checkbox"
              className="today-course-switch-input"
              checked={!hideCourses}
              onChange={(e) => setHideCourses(!e.target.checked)}
            />
            <span className="today-course-switch-track">
              <span className="today-course-switch-thumb" />
            </span>
            <span className="today-course-switch-label">课程表</span>
          </label>

          <button
            type="button"
            className="today-header-icon-btn"
            onClick={() => navigate("calendar")}
            title="打开日历"
            aria-label="打开日历"
          >
            <Calendar size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 移动端专属顶部：Today 大标题、快捷操作、副标题与回到今天、一周日期选择器 */}
      <div className="mobile-today-header">
        <div className="mobile-today-top-bar">
          <h1 className="mobile-today-title">Today</h1>
          <div className="mobile-today-actions">
            <button
              type="button"
              className={`mobile-today-action-btn ${hideCourses ? "" : "is-active"}`}
              onClick={() => setHideCourses(!hideCourses)}
              aria-label={hideCourses ? "显示课程表" : "隐藏课程表"}
              title={hideCourses ? "显示课程表" : "隐藏课程表"}
            >
              {hideCourses ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
              <span>课程</span>
            </button>
            <button
              type="button"
              className="mobile-today-action-btn"
              onClick={() => {
                const memoEl = document.querySelector(".today-memo-card");
                if (memoEl) {
                  memoEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              aria-label="查看备忘录"
              title="查看常驻备忘录"
            >
              <StickyNote size={13} aria-hidden="true" />
              <span>备忘录</span>
            </button>
            <button
              type="button"
              className="mobile-today-action-btn mobile-today-add-btn"
              onClick={() => setIsCreatingTask(true)}
              aria-label="添加事项"
              title="添加事项"
            >
              <Plus size={14} aria-hidden="true" />
              <span>事项</span>
            </button>
          </div>
        </div>
        <div className="mobile-today-subtitle-row">
          <div className="mobile-today-subtitle">
            <span>{isSelectedToday ? `今天 · ${formatMobileDate(selectedDate)}` : formatMobileDate(selectedDate)}</span>
          </div>
          {!isSelectedToday ? (
            <button
              type="button"
              className="mobile-today-back-today-btn"
              onClick={() => setSelectedDate(new Date())}
              aria-label="回到今天"
            >
              回到今天
            </button>
          ) : null}
        </div>
        <div className="mobile-week-strip" role="group" aria-label="一周日期选择">
          {mobileWeekDays.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={`mobile-week-day-btn ${day.isSelected ? "is-selected" : ""} ${day.isToday ? "is-today" : ""} ${day.hasExam ? "has-exam" : ""}`}
              onClick={() => setSelectedDate(day.date)}
              aria-pressed={day.isSelected}
            >
              <span className="mobile-week-day-name">{day.weekdayName}</span>
              <span className="mobile-week-day-num">{day.dayNumber}</span>
              {day.isSelected ? <span className="mobile-week-selected-indicator" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </div>

      {notice ? <div className="inline-toast" role="status">{notice}</div> : null}

      <div className="today-layout">
        <div className="today-grid">
          {/* 左侧：今日安排 */}
          <TodayScheduleSection
            allDay={allDay}
            untimed={untimed}
            timed={timed}
            date={selectedDate}
            now={now}
            displayStart={settings.calendarDisplayStart}
            displayEnd={settings.calendarDisplayEnd}
            hideCourses={hideCourses}
            onHideCoursesChange={setHideCourses}
            onOpenCalendar={() => navigate("calendar")}
            onAddSchedule={() => {
              setIsCreatingTask(true);
            }}
            onQuickAddTask={async (title) => {
              const due = new Date(selectedDate);
              due.setHours(23, 59, 0, 0);
              await addTasks([
                {
                  title: title.trim(),
                  status: "open",
                  planningState: "planned",
                  dueAt: due.toISOString(),
                  scheduledStartAt: null,
                  durationMinutes: null,
                  isAllDay: false,
                },
              ]);
              setNotice(`已添加「${title.trim()}」到${isSelectedToday ? "今日" : "该日"}安排`);
            }}
            onTask={(task, occurrenceAt) => {
              setEditingTask(task);
              setEditingTaskOccurrenceAt(occurrenceAt);
            }}
            onEvent={setEditingEvent}
            onBlock={openBlock}
            onTaskComplete={(task, at) => void toggleTask(task.id, at)}
            onEventComplete={(event) =>
              void updateEvent(event.id, {
                status: event.status === "completed" ? "open" : "completed",
                completedAt: event.status === "completed" ? null : new Date().toISOString(),
              })
            }
            onBlockComplete={(block) => void completeBlock(block)}
          />

          {/* 右侧：Deadline 和 Inbox */}
          <aside className="today-side-column">
            <TodaySummaryCards
              assignments={assignments}
              thoughts={inboxThoughts}
              settings={settings}
              projects={projects}
              onTask={(task) => {
                setEditingTask(task);
                setEditingTaskOccurrenceAt(undefined);
              }}
              onToggleTask={(taskId) => void toggleTask(taskId)}
              onThought={() => {}}
              onArchiveThought={(thoughtId) => void updateThoughtStatus([thoughtId], "archived")}
              onConvertToTask={async (thoughtId) => {
                const draft = await convertThoughtToDraft(thoughtId);
                if (draft) setEditingTask(draft);
              }}
              onConvertToProject={async (thoughtId) => {
                const thought = thoughts.find((t) => t.id === thoughtId);
                if (!thought) return;
                const visibleGoals = goals.filter((g) => !g.archived);
                let goal = visibleGoals[0];
                if (!goal) {
                  goal = await addGoal("常规目标", "#5B7B94");
                }
                const project = await addProject(goal.id, thought.content.trim(), [thought.id]);
                await updateThoughtStatus([thought.id], "archived", "已开始 Project");
                setNotice(`已将想法转为项目「${project.title}」`);
                navigate("projects", { projectId: project.id, initializeProject: true });
              }}
              onDeleteThought={async (thoughtId) => {
                try {
                  await updateThoughtStatus([thoughtId], "deleted", "已删除");
                  setNotice("已删除收集箱条目");
                } catch {
                  setNotice("删除失败，请重试。");
                }
              }}
              onAddThought={async (content) => {
                await addThought(content);
              }}
              onOpenProjects={() => navigate("projects")}
              defaultInboxExpanded={defaultInboxExpanded}
            />
          </aside>
        </div>
      </div>

      <TaskComposer
        open={Boolean(editingTask) || isCreatingTask}
        task={editingTask}
        occurrenceAt={
          editingTaskOccurrenceAt ??
          (editingTask?.recurrenceRule
            ? (taskOccurrenceOnDay(editingTask, selectedDate) ?? undefined)
            : undefined)
        }
        defaultDate={selectedDate}
        defaultTime={true}
        onClose={() => {
          setEditingTask(null);
          setEditingTaskOccurrenceAt(undefined);
          setIsCreatingTask(false);
        }}
      />
      <EventComposer open={Boolean(editingEvent)} event={editingEvent} occurrenceAt={editingEvent?.startAt} onClose={() => setEditingEvent(null)} />
      <ScheduleBlockComposer
        open={Boolean(blockSource)}
        source={blockSource}
        block={editingBlock}
        defaultDate={targetDate}
        onClose={() => {
          setBlockSource(null);
          setEditingBlock(null);
        }}
      />
      <TodayCompletionChoice
        block={completionBlock}
        onClose={() => setCompletionBlock(null)}
        onComplete={(block, scope) => {
          setCompletionBlock(null);
          void completeScheduleBlock(block.id, scope)
            .then(() =>
              setNotice(scope === "block" ? "已完成当前时间块" : "已完成整个事项"),
            )
            .catch(() => setNotice("没有完成成功，请重试。"));
        }}
      />
      {quickAddOpen ? (
        <CalendarQuickAdd
          date={selectedDate}
          initialRows={quickAddDraft}
          onClose={(rows) => {
            setQuickAddDraft(rows.some((r) => r.title.trim()) ? rows : undefined);
            setQuickAddOpen(false);
          }}
          onSave={async (entries) => {
            const due = new Date(selectedDate);
            due.setHours(23, 59, 0, 0);
            await addTasks(
              entries.map((entry) => ({
                title: entry.title,
                status: entry.completed ? "completed" as const : "open" as const,
                planningState: "planned" as const,
                dueAt: due.toISOString(),
                scheduledStartAt: null,
                durationMinutes: null,
                isAllDay: false,
              })),
            );
            setQuickAddDraft(undefined);
            setQuickAddOpen(false);
            setNotice(`已添加 ${entries.length} 项到今日安排`);
          }}
        />
      ) : null}
    </>
  );
}
