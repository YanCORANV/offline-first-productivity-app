import { ArrowUpRight, Check, Circle, Lightbulb, X } from "lucide-react";
import { usePlanner } from "../planner-provider";
import {
  formatShortDate,
  formatTime,
  isTaskOccurrenceCompleted,
  type PlannerTask,
} from "@/lib/domain";

export function TaskRow({
  task,
  onOpen,
  occurrenceAt,
}: {
  task: PlannerTask;
  onOpen?: (task: PlannerTask) => void;
  occurrenceAt?: string;
}) {
  const { toggleTask } = usePlanner();
  const failed = task.status === "failed";
  const completed =
    task.status === "completed" ||
    Boolean(task.recurrenceRule && occurrenceAt && isTaskOccurrenceCompleted(task, occurrenceAt));
  const assignmentLabel =
    task.taskKind === "assignment"
      ? {
          todo: "待完成",
          content_done: "待提交",
          submitted: "已提交",
        }[task.assignmentStatus ?? "todo"]
      : null;
  return (
    <div className={`task-row ${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`}>
      <button
        className="task-check"
        type="button"
        aria-label={
          failed
            ? `恢复任务：${task.title}`
            : completed
            ? `恢复任务：${task.title}`
            : `完成任务：${task.title}`
        }
        onClick={() => void toggleTask(task.id, occurrenceAt)}
      >
        {failed ? <X size={15} /> : completed ? <Check size={14} /> : <Circle size={16} />}
      </button>
      <button className="task-main" type="button" onClick={() => onOpen?.(task)}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {failed ? <span className="task-failed-badge">已失败</span> : null}
          {task.scheduledStartAt ? (
            <span>{formatTime(task.scheduledStartAt)}</span>
          ) : task.actualDeadlineAt || task.dueAt ? (
            <span>{formatShortDate(task.actualDeadlineAt ?? task.dueAt)}</span>
          ) : (
            <span>未安排</span>
          )}
          {task.durationMinutes ? <span> · {task.durationMinutes} 分钟</span> : null}
          {task.recurrenceRule ? <span> · 重复</span> : null}
          {assignmentLabel ? <span> · {assignmentLabel}</span> : null}
        </span>
      </button>
      {task.originThoughtIds.length ? (
        <span className="origin-chip" title="由 Quick Thought 转化">
          <Lightbulb size={12} />
          来源
        </span>
      ) : null}
      {onOpen ? <ArrowUpRight size={14} className="row-arrow" /> : null}
    </div>
  );
}
