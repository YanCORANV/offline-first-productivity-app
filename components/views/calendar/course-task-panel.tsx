"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Circle, LogOut, Plus, Undo2, X } from "lucide-react";
import {
  formatTime,
  localDateKey,
  type CalendarEvent,
  type PlannerTask,
} from "@/lib/domain";
import { nextCourseTaskSlot } from "@/lib/planning";
import { taskBelongsToCourseOccurrence } from "./calendar-model";
import { InspectorShell } from "../../composer-shell";
import { usePlanner } from "../../planner-provider";

export interface CourseTaskOccurrence {
  event: CalendarEvent;
  startAt: string;
  endAt: string;
}

export function CourseTaskPanel({
  occurrence,
  canUndoCourseChange,
  onClose,
  onEdit,
  onRemoveFromCourse,
  onUndoCourseChange,
}: {
  occurrence: CourseTaskOccurrence;
  canUndoCourseChange: boolean;
  onClose: () => void;
  onEdit: (task: PlannerTask) => void;
  onRemoveFromCourse: (task: PlannerTask) => Promise<void>;
  onUndoCourseChange: () => Promise<void>;
}) {
  const { addTask, tasks, settings, toggleTask } = usePlanner();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const occurrenceDate = localDateKey(new Date(occurrence.startAt));
  const courseTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.planningState !== "draft" &&
            taskBelongsToCourseOccurrence(
              task,
              occurrence.event.id,
              occurrenceDate,
            ),
        )
        .sort((left, right) =>
          (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? ""),
        ),
    [occurrence.event.id, occurrenceDate, tasks],
  );


  async function createTask(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || saving) return;
    setSaving(true);
    setError("");
    try {
      const slot = nextCourseTaskSlot(occurrence.startAt, occurrence.endAt, courseTasks);
      const due = new Date(occurrence.startAt);
      due.setHours(23, 59, 0, 0);
      const ordinaryType = settings.itemTypes.find(
        (type) =>
          type.id !== "course" &&
          type.id !== "deadline" &&
          type.name.trim().toLowerCase() !== "deadline",
      );
      await addTask({
        title: nextTitle,
        planningState: "planned",
        taskKind: "ordinary",
        dueAt: due.toISOString(),
        scheduledStartAt: slot.startAt,
        durationMinutes: slot.durationMinutes,
        isAllDay: false,
        recurrenceRule: null,
        itemTypeId: ordinaryType?.id ?? "research",
        courseEventId: occurrence.event.id,
        courseOccurrenceDate: occurrenceDate,
      });
      setTitle("");
    } catch {
      setError("没有创建成功，请重试。");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask(task: PlannerTask) {
    if (removingTaskId) return;
    setRemovingTaskId(task.id);
    setError("");
    try {
      await onRemoveFromCourse(task);
    } catch {
      setError("没有移出成功，请重试。");
    } finally {
      setRemovingTaskId(null);
    }
  }

  return (
    <InspectorShell
      title={"本节课 · " + occurrence.event.title}
      panelClassName="course-task-inspector"
      onClose={onClose}
    >
      <div className="course-task-panel">
        <header className="course-task-summary">
          <span>{occurrenceDate}</span>
          <strong>
            {formatTime(occurrence.startAt)}–{formatTime(occurrence.endAt)}
          </strong>
          <small>新增事项会优先安排在本节课剩余时段内，之后仍可单独调整。</small>
        </header>

        {canUndoCourseChange ? (
          <div className="course-task-undo" role="status">
            <span>刚才的课程安排可以恢复。</span>
            <button className="course-task-action" type="button" onClick={() => void onUndoCourseChange()}>
              <Undo2 size={14} /> 撤销刚才的课程安排变更
            </button>
          </div>
        ) : null}

        <form className="course-task-quick-add" onSubmit={createTask}>
          <label>
            <span>这节课准备做什么？</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：整理实验记录"
            />
          </label>
          <button
            className="primary-button"
            type="submit"
            disabled={!title.trim() || saving}
          >
            <Plus size={15} /> {saving ? "添加中…" : "添加事项"}
          </button>
        </form>
        {error ? (
          <p className="course-task-error" role="status">{error}</p>
        ) : null}

        <section className="course-task-list" aria-label="本节课的事项">
          <div className="section-heading">
            <h3>已安排</h3>
            <span>{courseTasks.length} 项</span>
          </div>
          {courseTasks.length ? (
            courseTasks.map((task) => (
              <article
                className={[
                  "course-task-row",
                  task.status === "completed" ? "is-completed" : "",
                  task.status === "failed" ? "is-failed" : "",
                ].filter(Boolean).join(" ")}
                key={task.id}
              >
                <button
                  className={`item-inline-check ${task.status === "failed" ? "is-failed" : ""}`}
                  type="button"
                  aria-label={
                    (task.status === "failed"
                      ? "恢复 "
                      : task.status === "completed"
                      ? "恢复 "
                      : "完成 ") + task.title
                  }
                  onClick={() =>
                    void toggleTask(task.id, task.scheduledStartAt ?? undefined)
                  }
                >
                  {task.status === "failed" ? (
                    <X size={12} />
                  ) : task.status === "completed" ? (
                    <Check size={12} />
                  ) : (
                    <Circle size={13} />
                  )}
                </button>
                <button
                  className="course-task-open"
                  type="button"
                  onClick={() => onEdit(task)}
                >
                  <strong>{task.title}</strong>
                  <small>
                    {task.scheduledStartAt
                      ? formatTime(task.scheduledStartAt)
                      : "待安排"}
                    {task.scheduledStartAt && task.durationMinutes
                      ? "–" +
                        formatTime(
                          new Date(
                            new Date(task.scheduledStartAt).getTime() +
                              task.durationMinutes * 60_000,
                          ).toISOString(),
                        )
                      : ""}
                  </small>
                </button>
                <button
                  className="course-task-action course-task-remove"
                  type="button"
                  disabled={removingTaskId !== null}
                  aria-label={"将 " + task.title + " 移出本节课"}
                  title="移出本节课并返回待落实"
                  onClick={() => void removeTask(task)}
                >
                  <LogOut size={13} />
                  <span>{removingTaskId === task.id ? "移出中…" : "移出"}</span>
                </button>
              </article>
            ))
          ) : (
            <p className="course-task-empty">还没有安排事项。</p>
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
