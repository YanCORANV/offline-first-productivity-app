"use client";

import "./calendar.css";
import { useEffect, useMemo, useState } from "react";
import { CandidatePool } from "./candidate-pool";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, EyeOff, Plus } from "lucide-react";
import { dayHasExam, entriesForDay } from "./calendar-model";
import { formatTime, localDateKey, startOfLocalDay } from "@/lib/domain";

import {
  EventComposer,
  ScheduleBlockComposer,
  TaskComposer,
} from "../../composers";
import { CompletionChoice } from "./calendar-grid";
import { CalendarToolbar } from "./calendar-toolbar";
import { CalendarWorkspace } from "./calendar-workspace";
import { CalendarQuickAdd } from "./calendar-quick-add";
import { CourseTaskPanel } from "./course-task-panel";
import { useCalendarController } from "./calendar-controller";

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

export function PlanView() {
  return <CalendarView />;
}

export function CalendarView() {
  const calendar = useCalendarController();
  const [presentation, setPresentation] = useState<"overview" | "timeline">("overview");
  const [mobileTab, setMobileTab] = useState<"day" | "week" | "month">(() => {
    if (typeof window === "undefined") return "month";
    const remembered = window.sessionStorage.getItem("quiet-plan-calendar-mobile-tab");
    return remembered === "day" || remembered === "week" || remembered === "month" ? remembered : "month";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("quiet-plan-calendar-mobile-tab", mobileTab);
    }
  }, [mobileTab]);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 47.9375rem)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 47.9375rem)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const workspaceDays = isMobile
    ? mobileTab === "day"
      ? [calendar.anchor]
      : calendar.days
    : calendar.days;

  const workspaceMode = isMobile
    ? mobileTab === "month"
      ? "month"
      : "week"
    : calendar.mode;

  const workspacePresentation = isMobile
    ? mobileTab === "day"
      ? "timeline"
      : "overview"
    : presentation;

  const activeDayEntries = useMemo(() => {
    if (!isMobile || mobileTab !== "month") return [];
    return entriesForDay(calendar.anchor, calendar.calendarProps, {
      hideCourses: calendar.hideCourses,
    });
  }, [isMobile, mobileTab, calendar.anchor, calendar.calendarProps, calendar.hideCourses]);

  const mobileWeekDays = useMemo(() => {
    if (!isMobile || mobileTab !== "day") return [];
    return getWeekDays(calendar.anchor).map((day) => {
      const dayEntries = entriesForDay(day.date, calendar.calendarProps, {
        hideCourses: calendar.hideCourses,
      });
      return {
        ...day,
        hasExam: dayHasExam(dayEntries, calendar.calendarProps.itemTypes),
      };
    });
  }, [
    isMobile,
    mobileTab,
    calendar.anchor,
    calendar.calendarProps,
    calendar.hideCourses,
  ]);

  const mobileDateLabel = useMemo(() => {
    if (mobileTab === "month") {
      return `${calendar.anchor.getFullYear()}年${calendar.anchor.getMonth() + 1}月`;
    }
    if (mobileTab === "week" && calendar.days.length >= 7) {
      const start = calendar.days[0];
      const end = calendar.days[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getMonth() + 1}月${start.getDate()}日–${end.getDate()}日`;
      }
      return `${start.getMonth() + 1}月${start.getDate()}日–${end.getMonth() + 1}月${end.getDate()}日`;
    }
    return `${calendar.anchor.getMonth() + 1}月${calendar.anchor.getDate()}日`;
  }, [mobileTab, calendar.anchor, calendar.days]);

  const handleGoToday = () => {
    calendar.goToday();
    if (isMobile && mobileTab === "week") {
      requestAnimationFrame(() => {
        const todayEl = document.getElementById("mobile-week-day-today");
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };

  return (
    <>
      <div className="calendar-page-layout">
        {/* Mobile Header: [ 日 | 周 | 月 ] + < 今天 > + [隐藏课程] in a single compact row */}
        <div className="mobile-calendar-header">
          <div className="mobile-calendar-toolbar-row">
            <div className="mobile-calendar-segmented" role="tablist" aria-label="日历视图切换">
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === "day"}
                className={`mobile-calendar-segment-btn ${mobileTab === "day" ? "is-active" : ""}`}
                onClick={() => {
                  setMobileTab("day");
                  calendar.changeMode("week");
                  setPresentation("timeline");
                }}
              >
                日
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === "week"}
                className={`mobile-calendar-segment-btn ${mobileTab === "week" ? "is-active" : ""}`}
                onClick={() => {
                  setMobileTab("week");
                  calendar.changeMode("week");
                  setPresentation("overview");
                }}
              >
                周
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === "month"}
                className={`mobile-calendar-segment-btn ${mobileTab === "month" ? "is-active" : ""}`}
                onClick={() => {
                  setMobileTab("month");
                  calendar.changeMode("month");
                }}
              >
                月
              </button>
            </div>

            <div className="mobile-calendar-nav-cluster">
              <button
                type="button"
                className="mobile-calendar-nav-arrow"
                onClick={() => calendar.move(-1)}
                aria-label={mobileTab === "month" ? "上个月" : "上一周"}
                title={mobileTab === "month" ? "上个月" : "上一周"}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="mobile-calendar-today-btn"
                onClick={handleGoToday}
                aria-label="回到今天"
                title="回到今天"
              >
                <CalendarIcon size={14} />
              </button>
              <button
                type="button"
                className="mobile-calendar-nav-arrow"
                onClick={() => calendar.move(1)}
                aria-label={mobileTab === "month" ? "下个月" : "下一周"}
                title={mobileTab === "month" ? "下个月" : "下一周"}
              >
                <ChevronRight size={16} />
              </button>
              <span className="mobile-calendar-date-label">
                {mobileDateLabel}
              </span>
            </div>

            <button
              type="button"
              className={`mobile-calendar-courses-toggle ${calendar.hideCourses ? "is-active" : ""}`}
              onClick={() => calendar.setHideCourses(!calendar.hideCourses)}
              aria-pressed={calendar.hideCourses}
              aria-label={calendar.hideCourses ? "显示课程表" : "隐藏课程表"}
              title={calendar.hideCourses ? "显示课程表" : "隐藏课程表"}
            >
              {calendar.hideCourses ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {mobileTab === "day" ? (
            <div className="mobile-week-strip" role="group" aria-label="一周日期选择">
              {mobileWeekDays.map((day) => (
                <button
                  key={day.dateKey}
                  type="button"
                  className={`mobile-week-day-btn ${day.isSelected ? "is-selected" : ""} ${day.isToday ? "is-today" : ""} ${day.hasExam ? "has-exam" : ""}`}
                  onClick={() => calendar.changeAnchor(day.date)}
                  aria-pressed={day.isSelected}
                >
                  <span className="mobile-week-day-name">{day.weekdayName}</span>
                  <span className="mobile-week-day-num">{day.dayNumber}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <CalendarToolbar
          view={calendar.mode === "month" ? "month" : presentation}
          onViewChange={(view) => {
            if (view !== "month") setPresentation(view);
            calendar.changeMode(view === "month" ? "month" : "week");
          }}
          onMove={calendar.move}
          onToday={calendar.goToday}
          onAdd={() => calendar.addItemForDate(calendar.anchor)}
          hideCourses={calendar.hideCourses}
          onHideCoursesChange={calendar.setHideCourses}
        >
          <CandidatePool
            candidates={calendar.candidates}
            limit={calendar.candidateLimit}
            busyId={calendar.candidateBusy}
            targetTaskId={calendar.targetTaskId}
            targetNodeId={calendar.targetNodeId}
            onLimitChange={calendar.setCandidateLimit}
            onOpen={calendar.openCandidate}
            onDelete={(candidate) => void calendar.deleteCandidate(candidate)}
          />
        </CalendarToolbar>

        <div className="calendar-page-main">
          {calendar.notice ? (
            <div className="inline-toast calendar-move-toast" role="status">
              <span>{calendar.notice}</span>
              {calendar.canUndoMove ? (
                <button className="text-button" type="button" onClick={() => void calendar.undoLastMove()}>撤销</button>
              ) : null}
            </div>
          ) : null}

          <CalendarWorkspace
            mode={workspaceMode}
            presentation={workspacePresentation}
            days={workspaceDays}
            anchor={calendar.anchor}
            periodLabel={calendar.periodLabel}
            calendarProps={calendar.calendarProps}
            hideCourses={calendar.hideCourses}
            onSwipeMonth={calendar.move}
          />

          {isMobile && mobileTab === "month" ? (
            <div className="mobile-month-agenda-card">
              <div className="mobile-month-agenda-header">
                <h3 className="mobile-month-agenda-title">
                  {calendar.anchor.getMonth() + 1}月{calendar.anchor.getDate()}日 安排
                </h3>
                <button
                  type="button"
                  className="mobile-month-agenda-add-btn"
                  onClick={() => calendar.addItemForDate(calendar.anchor)}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>新增事项</span>
                </button>
              </div>
              <div className="mobile-month-agenda-list">
                {activeDayEntries.length > 0 ? (
                  activeDayEntries.map((entry) => (
                    <div
                      key={entry.instanceKey}
                      className={`mobile-month-agenda-row ${entry.kind === "task" && entry.item.status === "failed" ? "is-failed" : ""}`}
                      onClick={() => {
                        if (entry.kind === "task") calendar.openTask(entry.item);
                        else if (entry.kind === "event") calendar.setEditingEvent({ event: entry.item, occurrenceAt: entry.at });
                      }}
                    >
                      <span className="mobile-month-agenda-color" style={{ backgroundColor: entry.color }} />
                      <div className="mobile-month-agenda-info">
                        <span className="mobile-month-agenda-name">
                          {entry.kind === "block"
                            ? (calendar.calendarProps.nodes.find((n) => n.id === entry.item.sourceId)?.title || "时间块")
                            : entry.item.title}
                        </span>
                        {entry.at ? (
                          <span className="mobile-month-agenda-time">
                            {formatTime(entry.at)}{entry.endAt ? ` - ${formatTime(entry.endAt)}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="mobile-month-agenda-empty">当天暂无安排</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating Action Button (FAB) on Mobile */}
      <button
        type="button"
        className="mobile-calendar-fab"
        onClick={() => calendar.addItemForDate(calendar.anchor)}
        aria-label="新增事项"
        title="新增事项"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      <TaskComposer
        open={calendar.itemComposer || Boolean(calendar.editingTask)}
        task={calendar.editingTask}
        occurrenceAt={calendar.taskOccurrenceAt}
        defaultDate={calendar.composerDate}
        defaultTime={calendar.composerWithTime}
        prefillDraftDate={calendar.prefillDraftDate}
        onQuickAdd={calendar.openQuickAdd}
        onClose={calendar.closeTaskComposer}
      />
      {calendar.quickAddDate ? (
        <CalendarQuickAdd
          date={calendar.quickAddDate}
          initialRows={calendar.quickAddDraft}
          onClose={calendar.closeQuickAdd}
          onSave={calendar.saveQuickTasks}
        />
      ) : null}
      <EventComposer
        open={Boolean(calendar.editingEvent)}
        event={calendar.editingEvent?.event}
        occurrenceAt={calendar.editingEvent?.occurrenceAt}
        onClose={() => calendar.setEditingEvent(null)}
      />
      {calendar.courseTaskOccurrence ? (
        <CourseTaskPanel
          occurrence={calendar.courseTaskOccurrence}
          canUndoCourseChange={calendar.canUndoMove}
          onClose={calendar.closeCourseTaskPanel}
          onUndoCourseChange={calendar.undoLastMove}
          onRemoveFromCourse={calendar.removeTaskFromCourse}
          onEdit={(task) => {
            calendar.closeCourseTaskPanel();
            calendar.openTask(task);
          }}
        />
      ) : null}
      <ScheduleBlockComposer
        open={Boolean(calendar.blockSource)}
        source={calendar.blockSource}
        block={calendar.editingBlock}
        defaultDate={calendar.composerDate ?? calendar.anchor}
        onClose={calendar.closeScheduleComposer}
      />
      {calendar.completionBlock ? (
        <CompletionChoice
          onClose={() => calendar.setCompletionBlock(null)}
          onComplete={calendar.completeSelectedBlock}
        />
      ) : null}
    </>
  );
}
