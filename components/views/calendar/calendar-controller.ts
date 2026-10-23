import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppNavigation } from "../../app-navigation";
import { usePlanner } from "../../planner-provider";
import { type CalendarCandidate } from "./candidate-pool";
import { taskTimingSummary } from "./calendar-grid";
import type { CalendarMode } from "./calendar-toolbar";
import {
  taskBelongsToCourseOccurrence,
  type CalendarCommonProps,
  type DragPayload,
} from "./calendar-model";
import { nextCourseTaskSlot } from "@/lib/planning";
import type { QuickTaskRow } from "./calendar-quick-add-model";
import {
  daysFrom,
  localDateKey,
  startOfLocalDay,
  startOfWeek,
  type CalendarEvent,
  type PlannerTask,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";

type MoveUndo =
  | { kind: "task"; id: string; patch: Partial<PlannerTask> }
  | { kind: "event"; id: string; patch: Partial<CalendarEvent> }
  | { kind: "block"; id: string; patch: Partial<ScheduleBlock> }
  | { kind: "new-block"; id: string };

export function useCalendarController() {
  const planner = usePlanner();
  const { intent } = useAppNavigation();
  const {
    tasks,
    events,
    thoughts,
    goals,
    projects,
    projectNodes,
    scheduleBlocks,
    settings,
    addTasks,
    addScheduleBlock,
    deleteScheduleBlock,
    convertThoughtToDraft,
    updateTask,
    updateEvent,
    updateScheduleBlock,
    toggleTask,
    completeScheduleBlock,
    deleteTask,
    deleteProjectNode,
    updateThoughtStatus,
  } = planner;
  const [mode, setMode] = useState<CalendarMode>(() => {
    if (typeof window === "undefined") return "month";
    const remembered = window.sessionStorage.getItem("quiet-plan-calendar-mode");
    return remembered === "month" || remembered === "week" ? remembered : "month";
  });
  const [hideCourses, setHideCourses] = useState(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("quiet-plan-calendar-hide-courses", "true");
    }
    return true;
  });

  useEffect(() => {
    window.sessionStorage.setItem("quiet-plan-calendar-hide-courses", String(hideCourses));
  }, [hideCourses]);
  const [anchor, setAnchor] = useState(startOfLocalDay(new Date()));
  const [candidateLimit, setCandidateLimit] = useState(8);
  const [itemComposer, setItemComposer] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [quickAddDrafts, setQuickAddDrafts] = useState<Record<string, QuickTaskRow[]>>({});
  const [composerDate, setComposerDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [taskOccurrenceAt, setTaskOccurrenceAt] = useState<string | undefined>();
  const [prefillDraftDate, setPrefillDraftDate] = useState(false);
  const [composerWithTime, setComposerWithTime] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    event: CalendarEvent;
    occurrenceAt: string;
  } | null>(null);
  const [courseTaskOccurrence, setCourseTaskOccurrence] = useState<{
    event: CalendarEvent;
    startAt: string;
    endAt: string;
  } | null>(null);
  const [blockSource, setBlockSource] = useState<PlannerTask | ProjectNode | null>(null);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [completionBlock, setCompletionBlock] = useState<ScheduleBlock | null>(null);
  const [notice, setNotice] = useState("");
  const undoMoveRef = useRef<MoveUndo | null>(null);
  const [canUndoMove, setCanUndoMove] = useState(false);
  const [candidateBusy, setCandidateBusy] = useState<string | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem("quiet-plan-calendar-mode", mode);
  }, [mode]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => {
      setNotice("");
      if (!courseTaskOccurrence) {
        undoMoveRef.current = null;
        setCanUndoMove(false);
      }
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [courseTaskOccurrence, notice]);

  function showNotice(message: string) {
    undoMoveRef.current = null;
    setCanUndoMove(false);
    setNotice(message);
  }


  function offerMoveUndo(message: string, undo: MoveUndo) {
    undoMoveRef.current = undo;
    setCanUndoMove(true);
    setNotice(message);
  }

  async function undoLastMove() {
    const undo = undoMoveRef.current;
    if (!undo) return;
    undoMoveRef.current = null;
    setCanUndoMove(false);
    try {
      if (undo.kind === "task") await updateTask(undo.id, undo.patch);
      else if (undo.kind === "event") await updateEvent(undo.id, undo.patch);
      else if (undo.kind === "block") await updateScheduleBlock(undo.id, undo.patch);
      else await deleteScheduleBlock(undo.id);
      setNotice("已撤销移动");
    } catch {
      setNotice("撤销失败，请重试。");
    }
  }

  const candidates = useMemo<CalendarCandidate[]>(() => {
    const scheduledNodeIds = new Set(
      scheduleBlocks
        .filter((block) => block.status === "planned")
        .map((block) => block.sourceId),
    );
    const parentNodeIds = new Set(
      projectNodes.map((node) => node.parentId).filter((id): id is string => Boolean(id)),
    );
    const nodesById = new Map(projectNodes.map((node) => [node.id, node]));
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
    const pathFor = (node: ProjectNode) => {
      const project = projectsById.get(node.projectId);
      const goal = project ? goalsById.get(project.goalId) : undefined;
      const names: string[] = [];
      let current = node.parentId ? nodesById.get(node.parentId) : undefined;
      while (current) {
        names.unshift(current.title);
        current = current.parentId ? nodesById.get(current.parentId) : undefined;
      }
      return [goal?.name, project?.title, ...names].filter(Boolean).join(" › ");
    };
    const leaves = projectNodes
      .filter(
        (node) =>
          node.status === "open" &&
          node.isFocused &&
          !parentNodeIds.has(node.id) &&
          !scheduledNodeIds.has(node.id),
      )
      .map((item) => ({
        kind: "node" as const,
        item,
        caption: `当前推进 · ${pathFor(item)}`,
      }));
    const draftTasks = tasks
      .filter((task) => task.status === "open" && task.planningState === "draft")
      .map((item) => ({
        kind: "task" as const,
        item,
        caption: taskTimingSummary(item),
      }));
    const openThoughts = thoughts
      .filter((thought) => thought.status === "inbox")
      .map((item) => ({
        kind: "thought" as const,
        item,
        caption: "Quick Thought · 先转为事项再安排",
      }));
    return [...draftTasks, ...leaves, ...openThoughts].slice(0, 24);
  }, [goals, projectNodes, projects, scheduleBlocks, tasks, thoughts]);

  const days = useMemo(
    () =>
      mode === "week"
        ? daysFrom(startOfWeek(anchor), 7)
        : daysFrom(startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), 42),
    [anchor, mode],
  );
  const periodLabel = useMemo(
    () =>
      mode === "month"
        ? `${anchor.getFullYear()} 年 ${anchor.getMonth() + 1} 月`
        : "",
    [anchor, mode],
  );

  function move(direction: -1 | 1) {
    const next = new Date(anchor);
    if (mode === "week") next.setDate(next.getDate() + direction * 7);
    if (mode === "month") next.setMonth(next.getMonth() + direction);
    setAnchor(next);
  }

  function addItemForDate(date: Date, withTime = false) {
    setComposerDate(date);
    setPrefillDraftDate(true);
    setComposerWithTime(withTime);
    setEditingTask(null);
    setItemComposer(true);
  }

  function openQuickAdd(date: Date) {
    closeTaskComposer();
    setQuickAddDate(new Date(date));
  }

  function closeQuickAdd(rows: QuickTaskRow[]) {
    if (!quickAddDate) return;
    const key = localDateKey(quickAddDate);
    setQuickAddDrafts((current) => ({ ...current, [key]: rows }));
    setQuickAddDate(null);
  }

  async function saveQuickTasks(
    entries: Array<{ title: string; completed: boolean }>,
  ) {
    if (!quickAddDate) return;
    const due = new Date(quickAddDate);
    due.setHours(23, 59, 0, 0);
    await addTasks(
      entries.map((entry) => ({
        title: entry.title,
        status: entry.completed ? "completed" : "open",
        planningState: "planned",
        dueAt: due.toISOString(),
        scheduledStartAt: null,
        durationMinutes: null,
        isAllDay: false,
      })),
    );
    const key = localDateKey(quickAddDate);
    setQuickAddDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    const dateLabel = new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
    }).format(quickAddDate);
    setQuickAddDate(null);
    const completed = entries.filter((entry) => entry.completed).length;
    showNotice(`${dateLabel} 已添加 ${entries.length} 项${completed ? `，其中 ${completed} 项已完成` : "，均为待安排"}`);
  }

  async function moveItem(payload: DragPayload, targetDate: Date, withTime: boolean) {
    const date = localDateKey(targetDate);
    if (payload.kind === "thought") {
      const task = await convertThoughtToDraft(payload.id);
      if (!task) return;
      const due = new Date(targetDate);
      due.setHours(23, 59, 0, 0);
      await updateTask(task.id, {
        planningState: "planned",
        dueAt: due.toISOString(),
        scheduledStartAt: withTime ? targetDate.toISOString() : null,
      });
      showNotice("想法已转为事项并安排，可从来源追溯");
      return;
    }
    if (payload.kind === "node") {
      const end = withTime
        ? new Date(targetDate.getTime() + 60 * 60_000).toISOString()
        : null;
      const block = await addScheduleBlock({
        sourceType: "projectNode",
        sourceId: payload.id,
        date,
        startAt: withTime ? targetDate.toISOString() : null,
        endAt: end,
      });
      offerMoveUndo("项目步骤已安排", { kind: "new-block", id: block.id });
      return;
    }
    if (payload.kind === "task") {
      const task = tasks.find((item) => item.id === payload.id);
      if (!task) return;
      if (task.recurrenceRule) {
        showNotice("重复事项请在编辑器中调整系列时间。");
        return;
      }
      const due = new Date(targetDate);
      due.setHours(23, 59, 0, 0);
      let scheduledStartAt = withTime ? targetDate.toISOString() : null;
      if (!withTime && task.scheduledStartAt) {
        const previous = new Date(task.scheduledStartAt);
        const moved = new Date(targetDate);
        moved.setHours(previous.getHours(), previous.getMinutes(), 0, 0);
        scheduledStartAt = moved.toISOString();
      }
      await updateTask(task.id, {
        planningState: "planned",
        dueAt: due.toISOString(),
        scheduledStartAt,
      });
      offerMoveUndo("事项已移动", {
        kind: "task",
        id: task.id,
        patch: { planningState: task.planningState, dueAt: task.dueAt, scheduledStartAt: task.scheduledStartAt },
      });
      return;
    }
    if (payload.kind === "block") {
      const block = scheduleBlocks.find((item) => item.id === payload.id);
      if (!block) return;
      if (!withTime || !block.startAt || !block.endAt) {
        await updateScheduleBlock(block.id, {
          date,
          startAt: withTime ? targetDate.toISOString() : null,
          endAt: withTime
            ? new Date(targetDate.getTime() + 60 * 60_000).toISOString()
            : null,
        });
        offerMoveUndo("时间块已移动", {
          kind: "block",
          id: block.id,
          patch: { date: block.date, startAt: block.startAt, endAt: block.endAt },
        });
        return;
      }
      const duration = new Date(block.endAt).getTime() - new Date(block.startAt).getTime();
      await updateScheduleBlock(block.id, {
        date,
        startAt: targetDate.toISOString(),
        endAt: new Date(targetDate.getTime() + duration).toISOString(),
      });
      offerMoveUndo("时间块已移动", {
        kind: "block",
        id: block.id,
        patch: { date: block.date, startAt: block.startAt, endAt: block.endAt },
      });
      return;
    }
    const event = events.find((item) => item.id === payload.id);
    if (!event) return;
    if (event.recurrenceRule) {
      showNotice("重复日程请在编辑器中调整系列时间。");
      return;
    }
    const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
    await updateEvent(event.id, {
      startAt: targetDate.toISOString(),
      endAt: new Date(targetDate.getTime() + duration).toISOString(),
    });
    offerMoveUndo("日程已移动", {
      kind: "event",
      id: event.id,
      patch: { startAt: event.startAt, endAt: event.endAt },
    });
  }

  async function moveItemToCourse(
    payload: DragPayload,
    event: CalendarEvent,
    startAt: string,
    endAt: string,
  ) {
    if (payload.kind !== "task" && payload.kind !== "thought") {
      showNotice("课程内只能安排事项；请先将项目步骤转为事项。");
      return;
    }
    const converted = payload.kind === "thought";
    const task = converted
      ? await convertThoughtToDraft(payload.id)
      : tasks.find((item) => item.id === payload.id) ?? null;
    if (!task) return;
    if (task.recurrenceRule) {
      showNotice("重复事项请先在编辑器中取消重复，再安排到课程内。");
      return;
    }
    const occurrenceDate = localDateKey(new Date(startAt));
    const courseTasks = tasks
      .filter(
        (item) =>
          item.id !== task.id &&
          item.planningState !== "draft" &&
          taskBelongsToCourseOccurrence(item, event.id, occurrenceDate),
      )
      .sort((left, right) =>
        (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? ""),
      );
    const slot = nextCourseTaskSlot(startAt, endAt, courseTasks);
    const due = new Date(startAt);
    due.setHours(23, 59, 0, 0);
    await updateTask(task.id, {
      planningState: "planned",
      dueAt: due.toISOString(),
      scheduledStartAt: slot.startAt,
      durationMinutes: slot.durationMinutes,
      isAllDay: false,
      courseEventId: event.id,
      courseOccurrenceDate: occurrenceDate,
    });
    setCourseTaskOccurrence({ event, startAt, endAt });
    if (converted) {
      showNotice(`想法已转为事项并安排到 ${event.title}`);
      return;
    }
    offerMoveUndo(`事项已安排到 ${event.title}`, {
      kind: "task",
      id: task.id,
      patch: {
        planningState: task.planningState,
        dueAt: task.dueAt,
        scheduledStartAt: task.scheduledStartAt,
        durationMinutes: task.durationMinutes,
        isAllDay: task.isAllDay,
        courseEventId: task.courseEventId,
        courseOccurrenceDate: task.courseOccurrenceDate,
      },
    });
  }

  async function removeTaskFromCourse(task: PlannerTask) {
    if (!task.courseEventId || !task.courseOccurrenceDate) return;
    await updateTask(task.id, {
      planningState: "draft",
      dueAt: null,
      scheduledStartAt: null,
      isAllDay: false,
      courseEventId: null,
      courseOccurrenceDate: null,
    });
    offerMoveUndo("事项已移出课程并返回待落实", {
      kind: "task",
      id: task.id,
      patch: {
        planningState: task.planningState,
        dueAt: task.dueAt,
        scheduledStartAt: task.scheduledStartAt,
        isAllDay: task.isAllDay,
        courseEventId: task.courseEventId,
        courseOccurrenceDate: task.courseOccurrenceDate,
      },
    });
  }

  async function deleteCandidate(candidate: CalendarCandidate) {
    if (candidate.kind === "task") await deleteTask(candidate.item.id);
    else if (candidate.kind === "node") await deleteProjectNode(candidate.item.id);
    else await updateThoughtStatus([candidate.item.id], "deleted", "已删除");
  }

  function openCandidate(candidate: CalendarCandidate) {
    if (candidate.kind === "task") {
      setEditingTask(candidate.item);
      setComposerDate(anchor);
      setPrefillDraftDate(true);
      setComposerWithTime(false);
      return;
    }
    if (candidate.kind === "node") {
      setBlockSource(candidate.item);
      setComposerDate(anchor);
      return;
    }
    const busyId = `${candidate.kind}-${candidate.item.id}`;
    setCandidateBusy(busyId);
    void convertThoughtToDraft(candidate.item.id)
      .then((task) => {
        if (!task) return;
        setEditingTask(task);
        setComposerDate(anchor);
        setPrefillDraftDate(true);
        setComposerWithTime(false);
      })
      .catch(() => showNotice("没有转换成功，请重试。"))
      .finally(() => setCandidateBusy(null));
  }

  function openBlock(block: ScheduleBlock) {
    const source =
      block.sourceType === "task"
        ? tasks.find((task) => task.id === block.sourceId) ?? null
        : projectNodes.find((node) => node.id === block.sourceId) ?? null;
    setBlockSource(source);
    setEditingBlock(block);
  }

  async function requestBlockCompletion(block: ScheduleBlock) {
    if (block.status === "performed") {
      await updateScheduleBlock(block.id, { status: "planned" });
      return;
    }
    const siblingCount = scheduleBlocks.filter(
      (candidate) =>
        candidate.sourceType === block.sourceType &&
        candidate.sourceId === block.sourceId &&
        candidate.status === "planned",
    ).length;
    if (siblingCount > 1) setCompletionBlock(block);
    else await completeScheduleBlock(block.id, "item");
  }

  async function completeSelectedBlock(scope: "block" | "item") {
    if (!completionBlock) return;
    const block = completionBlock;
    setCompletionBlock(null);
    try {
      await completeScheduleBlock(block.id, scope);
      showNotice(scope === "block" ? "已完成当前时间块" : "已完成整个事项");
    } catch {
      showNotice("没有完成成功，请重试。");
    }
  }

  const itemColor = useCallback(
    (item: PlannerTask | CalendarEvent) =>
      item.colorOverride ||
      settings.itemTypes.find((type) => type.id === item.itemTypeId)?.color ||
      settings.itemTypes[0]?.color ||
      "#AFC3D4",
    [settings.itemTypes],
  );

  const nodeColor = useCallback((node: ProjectNode) => {
    const project = projects.find((item) => item.id === node.projectId);
    return goals.find((goal) => goal.id === project?.goalId)?.color ?? "#AFC3D4";
  }, [goals, projects]);

  const calendarProps: CalendarCommonProps = {
    tasks,
    events,
    blocks: scheduleBlocks,
    nodes: projectNodes,
    goals,
    projects,
    itemTypes: settings.itemTypes,
    displayStart: settings.calendarDisplayStart,
    displayEnd: settings.calendarDisplayEnd,
    itemColor,
    nodeColor,
    onTask: openTask,
    onTaskComplete: (task, occurrenceAt) => {
      void toggleTask(task.id, occurrenceAt).catch(() => showNotice("完成状态更新失败，请重试。"));
    },
    onEvent: (event, occurrenceAt) => setEditingEvent({ event, occurrenceAt }),
    onCourseTasks: (event, startAt, endAt) =>
      setCourseTaskOccurrence({ event, startAt, endAt }),
    onCourseDrop: moveItemToCourse,
    onEventComplete: (event) =>
      void updateEvent(event.id, {
        status: event.status === "completed" ? "open" : "completed",
        completedAt: event.status === "completed" ? null : new Date().toISOString(),
      }),
    onBlock: openBlock,
    onBlockComplete: (block) => void requestBlockCompletion(block),
    onAdd: addItemForDate,
    onQuickAdd: openQuickAdd,
    onMove: moveItem,
    onSelectDay: changeAnchor,
  };

  function openTask(task: PlannerTask, occurrenceAt?: string) {
    setItemComposer(false);
    setTaskOccurrenceAt(occurrenceAt);
    setEditingTask(task);
  }

  function closeTaskComposer() {
    setTaskOccurrenceAt(undefined);
    setItemComposer(false);
    setEditingTask(null);
    setComposerDate(undefined);
    setPrefillDraftDate(false);
    setComposerWithTime(false);
  }

  function closeScheduleComposer() {
    setBlockSource(null);
    setEditingBlock(null);
    setComposerDate(undefined);
  }

  function closeCourseTaskPanel() {
    setCourseTaskOccurrence(null);
    if (notice) return;
    undoMoveRef.current = null;
    setCanUndoMove(false);
  }

  function changeMode(nextMode: CalendarMode) {
    setMode(nextMode);
  }

  function changeAnchor(date: Date) {
    setAnchor(startOfLocalDay(date));
  }

  function goToday() {
    setAnchor(startOfLocalDay(new Date()));
  }

  return {
    mode,
    hideCourses,
    anchor,
    candidateLimit,
    itemComposer,
    quickAddDate,
    quickAddDraft: quickAddDate ? quickAddDrafts[localDateKey(quickAddDate)] : undefined,
    composerDate,
    editingTask,
    taskOccurrenceAt,
    prefillDraftDate,
    composerWithTime,
    editingEvent,
    blockSource,
    courseTaskOccurrence,
    editingBlock,
    completionBlock,
    notice,
    canUndoMove,
    candidateBusy,
    candidates,
    days,
    periodLabel,
    targetTaskId: intent.taskId,
    targetNodeId: intent.nodeId,
    calendarProps,
    changeMode,
    changeAnchor,
    setHideCourses,
    move,
    goToday,
    setCandidateLimit,
    addItemForDate,
    openQuickAdd,
    closeQuickAdd,
    saveQuickTasks,
    deleteCandidate,
    openCandidate,
    closeTaskComposer,
    closeScheduleComposer,
    openTask,
    setEditingEvent,
    setCompletionBlock,
    closeCourseTaskPanel,
    completeSelectedBlock,
    removeTaskFromCourse,
    undoLastMove,
  };
}
