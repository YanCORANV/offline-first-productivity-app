import { useMemo } from "react";
import {
  eventOccurrenceOnDay,
  localDateKey,
  startOfLocalDay,
  taskOccurrencesOnDay,
  type CalendarEvent,
  type Goal,
  type PlannerTask,
  type PlannerSettings,
  type Project,
  type ProjectNode,
  type QuickThought,
  type ScheduleBlock,
} from "@/lib/domain";
import {
  buildAdvanceCandidates,
  freeTimeRanges,
  recommendCandidatesForGaps,
  recommendationTargetDate,
  taskTitleForBlock,
} from "@/lib/planning";

export function useTodayModel({
  tasks,
  events,
  thoughts,
  goals,
  projects,
  projectNodes,
  scheduleBlocks,
  settings,
  now,
  advanceTab,
  hideCourses = true,
}: {
  tasks: PlannerTask[];
  events: CalendarEvent[];
  thoughts: QuickThought[];
  goals: Goal[];
  projects: Project[];
  projectNodes: ProjectNode[];
  scheduleBlocks: ScheduleBlock[];
  settings: PlannerSettings;
  now: Date;
  advanceTab: "recommended" | "all";
  hideCourses?: boolean;
}) {
  const todayKey = localDateKey(now);
  const hourKey = `${todayKey}:${now.getHours()}`;
  const todayDate = useMemo(() => new Date(`${todayKey}T12:00:00`), [todayKey]);
  const todayStart = useMemo(() => startOfLocalDay(todayDate), [todayDate]);
  const modelNow = useMemo(() => {
    const [date, hour] = hourKey.split(":");
    return new Date(`${date}T${hour.padStart(2, "0")}:00:00`);
  }, [hourKey]);
  const targetDate = useMemo(
    () => recommendationTargetDate(modelNow),
    [modelNow],
  );
  const targetDateKey = localDateKey(targetDate);
  const targetSleepTime = settings.sleepOverrides[targetDateKey] ?? settings.defaultSleepTime;
  const dayEvents = useMemo(
    () =>
      events.filter((event) => {
        if (hideCourses && (event.eventKind === "course" || event.itemTypeId === "course")) {
          return false;
        }
        return Boolean(eventOccurrenceOnDay(event, todayDate));
      }),
    [events, hideCourses, todayDate],
  );
  const effectiveDayEvents = useMemo(() => dayEvents.map((event) => {
    const occurrence = eventOccurrenceOnDay(event, todayDate) ?? event.startAt;
    const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
    return { ...event, startAt: occurrence, endAt: new Date(new Date(occurrence).getTime() + duration).toISOString() };
  }), [dayEvents, todayDate]);
  const dayBlocks = useMemo(() => scheduleBlocks.filter((block) => block.date === todayKey && block.status !== "skipped"), [scheduleBlocks, todayKey]);
  const dayBlockSources = useMemo(() => new Set(dayBlocks.map((block) => block.sourceId)), [dayBlocks]);
  const dayTaskOccurrences = useMemo(() => tasks.flatMap((task) =>
    taskOccurrencesOnDay(task, todayDate)
      .filter(({ anchor }) => {
        const isPrimary = anchor.kind === "scheduled" || anchor.kind === "due";
        return !isPrimary || !dayBlockSources.has(task.id);
      })
      .map((occurrence) => ({ task, ...occurrence }))),
  [dayBlockSources, tasks, todayDate]);
  const overdueTasks = useMemo(() => tasks.filter((task) => {
    if (task.status !== "open" || task.planningState === "draft") return false;
    const anchor = task.taskKind === "assignment" ? task.desiredCompletionAt ?? task.actualDeadlineAt : task.dueAt;
    return Boolean(anchor && new Date(anchor) < todayStart);
  }), [tasks, todayStart]);
  const assignments = useMemo(() => tasks.filter((task) => task.taskKind === "assignment" && task.assignmentStatus !== "submitted" && task.status === "open"), [tasks]);
  const inboxThoughts = useMemo(
    () => thoughts.filter((thought) => thought.status === "inbox"),
    [thoughts],
  );
  const freeRanges = useMemo(() => freeTimeRanges(targetDate, settings.defaultWakeTime, targetSleepTime, events, scheduleBlocks, tasks, 20), [events, scheduleBlocks, settings.defaultWakeTime, targetDate, targetSleepTime, tasks]);
  const largestGap = Math.max(0, ...freeRanges.map((range) => range.minutes));
  const allAdvanceCandidates = useMemo(() => buildAdvanceCandidates({ tasks, projectNodes, projects, goals, scheduleBlocks, targetDate, now: modelNow }), [goals, modelNow, projectNodes, projects, scheduleBlocks, targetDate, tasks]);
  const recommendedCandidates = useMemo(() => recommendCandidatesForGaps(allAdvanceCandidates, freeRanges), [allAdvanceCandidates, freeRanges]);
  const visibleAdvanceCandidates = advanceTab === "recommended" ? recommendedCandidates : allAdvanceCandidates;
  const allDay = useMemo(() =>
    dayTaskOccurrences
      .filter(({ task, anchor }) => task.isAllDay && !anchor.timed)
      .map(({ task, occurrenceAt }) => ({ kind: "task" as const, item: task, title: task.title, occurrenceAt })),
  [dayTaskOccurrences]);
  const untimed = useMemo(() => [
    ...dayTaskOccurrences.filter(({ task, anchor }) => !task.isAllDay && !anchor.timed).map(({ task, occurrenceAt }) => ({ kind: "task" as const, item: task, title: task.title, occurrenceAt })),
    ...dayBlocks.filter((block) => !block.startAt).map((block) => ({ kind: "block" as const, item: block, title: taskTitleForBlock(block, tasks, projectNodes) })),
  ], [dayBlocks, dayTaskOccurrences, projectNodes, tasks]);
  const lookup = useMemo(() => ({
    itemTypeColors: new Map(settings.itemTypes.map((type) => [type.id, type.color])),
    nodesById: new Map(projectNodes.map((node) => [node.id, node])),
    projectsById: new Map(projects.map((project) => [project.id, project])),
    goalsById: new Map(goals.map((goal) => [goal.id, goal])),
  }), [goals, projectNodes, projects, settings.itemTypes]);
  const timed = useMemo(() => [
    ...effectiveDayEvents.map((event) => ({ kind: "event" as const, item: event, at: event.startAt, endAt: event.endAt, title: event.title, color: event.colorOverride || lookup.itemTypeColors.get(event.itemTypeId) || "#B9B2CC" })),
    ...dayTaskOccurrences.filter(({ anchor }) => anchor.timed).map(({ task, anchor, occurrenceAt }) => ({ kind: "task" as const, item: task, at: occurrenceAt, endAt: anchor.usesDuration && task.durationMinutes ? new Date(new Date(occurrenceAt).getTime() + task.durationMinutes * 60_000).toISOString() : occurrenceAt, title: task.title, color: task.colorOverride || lookup.itemTypeColors.get(task.itemTypeId) || "#AFC3D4", instanceKey: `task-${task.id}-${anchor.kind}-${occurrenceAt}`, timingLabel: anchor.kind === "desired" ? "预期完成" : anchor.kind === "deadline" ? "实际截止" : undefined })),
    ...dayBlocks.filter((block) => block.startAt).map((block) => {
      const node = lookup.nodesById.get(block.sourceId);
      const project = node ? lookup.projectsById.get(node.projectId) : undefined;
      const goal = project ? lookup.goalsById.get(project.goalId) : undefined;
      return { kind: "block" as const, item: block, at: block.startAt!, endAt: block.endAt ?? new Date(new Date(block.startAt!).getTime() + 60 * 60_000).toISOString(), title: taskTitleForBlock(block, tasks, projectNodes), color: goal?.color ?? "#AFC3D4" };
    }),
  ].sort((a, b) => a.at.localeCompare(b.at)), [dayBlocks, dayTaskOccurrences, effectiveDayEvents, lookup, projectNodes, tasks]);

  return { targetDate, targetDateKey, targetSleepTime, dayEvents, dayBlocks, overdueTasks, assignments, inboxThoughts, freeRanges, largestGap, visibleAdvanceCandidates, allDay, untimed, timed };
}
