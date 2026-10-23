import {
  eventOccurrenceOnDay,
  isTaskOccurrenceCompleted,
  localDateKey,
  startOfLocalDay,
  taskOccurrenceOnDay,
  type CalendarEvent,
  type Goal,
  type PlannerTask,
  type Project,
  type ProjectNode,
  type ScheduleBlock,
} from "../domain.ts";

export interface FreeTimeRange {
  startAt: string;
  endAt: string;
  minutes: number;
}

export function recommendationTargetDate(now = new Date()): Date {
  const target = new Date(now);
  target.setHours(12, 0, 0, 0);
  return target;
}

export function freeTimeRanges(
  date: Date,
  wakeTime: string,
  sleepTime: string,
  events: CalendarEvent[],
  blocks: ScheduleBlock[],
  tasks: PlannerTask[] = [],
  minimumMinutes = 20,
): FreeTimeRange[] {
  const key = localDateKey(date);
  const hasOpenAllDayTask = tasks.some((task) => {
    if (task.status !== "open" || !task.isAllDay) return false;
    const occurrence = taskOccurrenceOnDay(task, date);
    return Boolean(
      occurrence && !isTaskOccurrenceCompleted(task, occurrence),
    );
  });
  if (hasOpenAllDayTask) return [];
  const fromClock = (clock: string) => {
    const [hour, minute] = clock.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hour, minute, 0, 0);
    return result;
  };
  const start = fromClock(wakeTime);
  const end = fromClock(sleepTime);
  if (end <= start) end.setDate(end.getDate() + 1);
  const occupied = [
    ...events
      .filter((event) => event.status !== "completed")
      .flatMap((event) => {
        const occurrence = eventOccurrenceOnDay(event, date);
        if (!occurrence) return [];
        const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
        return [[
          new Date(occurrence),
          new Date(new Date(occurrence).getTime() + duration),
        ] as const];
      }),
    ...blocks
      .filter(
        (block) =>
          block.date === key &&
          block.status === "planned" &&
          block.startAt,
      )
      .map((block) => [
        new Date(block.startAt!),
        new Date(
          block.endAt ??
            new Date(new Date(block.startAt!).getTime() + 60 * 60_000).toISOString(),
        ),
      ] as const),
    ...tasks
      .filter(
        (task) =>
          task.status === "open" &&
          task.scheduledStartAt &&
          localDateKey(new Date(task.scheduledStartAt)) === key,
      )
      .map((task) => [
        new Date(task.scheduledStartAt!),
        new Date(
          new Date(task.scheduledStartAt!).getTime() +
            (task.durationMinutes ?? 0) * 60_000,
        ),
      ] as const),
  ]
    .map(
      ([a, b]) =>
        [
          new Date(Math.max(a.getTime(), start.getTime())),
          new Date(Math.min(b.getTime(), end.getTime())),
        ] as const,
    )
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0].getTime() - b[0].getTime());
  const merged: Array<[Date, Date]> = [];
  for (const interval of occupied) {
    const last = merged.at(-1);
    if (last && interval[0] <= last[1]) {
      last[1] = new Date(Math.max(last[1].getTime(), interval[1].getTime()));
    } else {
      merged.push([new Date(interval[0]), new Date(interval[1])]);
    }
  }
  const result: FreeTimeRange[] = [];
  let cursor = start;
  for (const [busyStart, busyEnd] of merged) {
    if (busyStart > cursor) {
      result.push({
        startAt: cursor.toISOString(),
        endAt: busyStart.toISOString(),
        minutes: Math.round((busyStart.getTime() - cursor.getTime()) / 60_000),
      });
    }
    if (busyEnd > cursor) cursor = busyEnd;
  }
  if (cursor < end) {
    result.push({
      startAt: cursor.toISOString(),
      endAt: end.toISOString(),
      minutes: Math.round((end.getTime() - cursor.getTime()) / 60_000),
    });
  }
  return result.filter((range) => range.minutes >= minimumMinutes);
}

export function recommendationLimit(ranges: FreeTimeRange[]): number {
  const largest = Math.max(0, ...ranges.map((range) => range.minutes));
  if (largest < 20) return 0;
  if (largest < 60) return 1;
  if (largest < 120) return 2;
  return 3;
}

export interface AdvanceCandidate {
  id: string;
  title: string;
  caption: string;
  source: PlannerTask | ProjectNode;
  needsContinuousTime: boolean;
  isFragmentFriendly: boolean;
  score: number;
  startsLater: boolean;
}

export function buildAdvanceCandidates({
  tasks,
  projectNodes,
  projects,
  goals,
  scheduleBlocks,
  targetDate,
  now = new Date(),
}: {
  tasks: PlannerTask[];
  projectNodes: ProjectNode[];
  projects: Project[];
  goals: Goal[];
  scheduleBlocks: ScheduleBlock[];
  targetDate: Date;
  now?: Date;
}): AdvanceCandidate[] {
  const todayKey = localDateKey(now);
  const targetDateKey = localDateKey(targetDate);
  const scheduledIds = new Set(
    scheduleBlocks
      .filter(
        (block) =>
          block.status === "planned" &&
          block.date >= todayKey &&
          !block.deletedAt,
      )
      .map((block) => block.sourceId),
  );
  const futureDirectTasks = new Set(
    tasks
      .filter(
        (task) =>
          task.scheduledStartAt &&
          new Date(task.scheduledStartAt) >= startOfLocalDay(now),
      )
      .map((task) => task.id),
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
  const daysUntil = (date?: string | null) =>
    date
      ? Math.ceil(
          (new Date(`${date}T12:00:00`).getTime() - targetDate.getTime()) /
            86_400_000,
        )
      : null;
  const projectScore = (projectId: string, focused: boolean) => {
    const project = projectsById.get(projectId);
    const remaining = daysUntil(project?.plannedEndDate);
    return (
      (focused ? 100 : 0) +
      (remaining == null
        ? 0
        : remaining <= 0
          ? 45
          : remaining <= 7
            ? 30
            : remaining <= 14
              ? 15
              : 0)
    );
  };
  const nodeCandidates = projectNodes.flatMap((node): AdvanceCandidate[] => {
    const project = projectsById.get(node.projectId);
    if (
      !project ||
      project.status !== "active" ||
      node.status !== "open" ||
      !node.isFocused ||
      parentNodeIds.has(node.id) ||
      scheduledIds.has(node.id)
    ) {
      return [];
    }
    return [{
      id: node.id,
      title: node.title,
      caption: pathFor(node),
      source: node,
      needsContinuousTime: Boolean(node.needsContinuousTime),
      isFragmentFriendly: Boolean(node.isFragmentFriendly),
      score: projectScore(project.id, node.isFocused),
      startsLater: Boolean(
        project.plannedStartDate && project.plannedStartDate > targetDateKey,
      ),
    }];
  });
  const taskCandidates = tasks.flatMap((task): AdvanceCandidate[] => {
    if (
      task.status !== "open" ||
      task.isAllDay ||
      scheduledIds.has(task.id) ||
      futureDirectTasks.has(task.id)
    ) {
      return [];
    }
    const anchor =
      task.taskKind === "assignment"
        ? task.actualDeadlineAt ?? task.desiredCompletionAt
        : task.dueAt;
    const remaining = anchor
      ? Math.ceil(
          (new Date(anchor).getTime() - targetDate.getTime()) / 86_400_000,
        )
      : null;
    return [{
      id: task.id,
      title: task.title,
      caption:
        task.taskKind === "assignment"
          ? remaining != null
            ? `Deadline · ${remaining <= 0 ? "已到期" : `还有 ${remaining} 天`}`
            : "Deadline · 尚未安排执行"
          : task.planningState === "draft"
            ? "待落实事项"
            : "尚未安排执行时间",
      source: task,
      needsContinuousTime: Boolean(task.needsContinuousTime),
      isFragmentFriendly: Boolean(task.isFragmentFriendly),
      score:
        remaining == null
          ? 0
          : remaining <= 0
            ? 40
            : remaining <= 3
              ? 25
              : remaining <= 7
                ? 12
                : 0,
      startsLater: false,
    }];
  });
  return [...nodeCandidates, ...taskCandidates].sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-CN"),
  );
}

export function recommendCandidatesForGaps(
  candidates: AdvanceCandidate[],
  ranges: FreeTimeRange[],
): AdvanceCandidate[] {
  const limit = recommendationLimit(ranges);
  if (!limit) return [];
  const largestGap = Math.max(0, ...ranges.map((range) => range.minutes));
  const fragmentedDay = ranges.filter(
    (range) => range.minutes >= 20 && range.minutes < 60,
  ).length >= 2;
  const fitScore = (candidate: AdvanceCandidate) => {
    if (candidate.startsLater) return Number.NEGATIVE_INFINITY;
    if (candidate.needsContinuousTime && largestGap < 120) {
      return Number.NEGATIVE_INFINITY;
    }
    if (largestGap >= 120) {
      return candidate.needsContinuousTime
        ? 100
        : candidate.isFragmentFriendly
          ? 10
          : 25;
    }
    if (largestGap < 60) return candidate.isFragmentFriendly ? 90 : 10;
    return candidate.isFragmentFriendly ? 35 : 20;
  };
  return candidates
    .map((candidate) => ({
      candidate,
      rank:
        candidate.score +
        fitScore(candidate) +
        (fragmentedDay && candidate.isFragmentFriendly ? 60 : 0),
    }))
    .filter((entry) => Number.isFinite(entry.rank))
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        a.candidate.title.localeCompare(b.candidate.title, "zh-CN"),
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
