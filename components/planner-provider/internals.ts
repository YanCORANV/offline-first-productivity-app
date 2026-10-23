import {
  DEFAULT_MEMO_ITEMS,
  DEFAULT_SETTINGS,
  newId,
  normalizeItemTypes,
  nowIso,
  type AiRun,
  type CalendarEvent,
  type FragmentActivity,
  type FragmentMinutes,
  type Goal,
  type MissedNotification,
  type OriginLink,
  type PlannerEntity,
  type PlannerSettings,
  type PlannerTask,
  type Project,
  type ProjectNode,
  type QuickThought,
  type ReminderRule,
  type ScheduleBlock,
  type SyncConflict,
  type SyncOperation,
} from "@/lib/domain";
import { getPlannerDb, type PlannerDatabase } from "@/lib/local-db";

export function normalizeTasks(records: PlannerTask[]) {
  return records
    .filter(active)
    .map((task) => ({
      ...task,
      planningState: task.planningState ?? "planned",
      isAllDay: Boolean(task.isAllDay),
      courseEventId: task.courseEventId ?? null,
      courseOccurrenceDate: task.courseOccurrenceDate ?? null,
      needsContinuousTime: Boolean(task.needsContinuousTime),
      isFragmentFriendly: !task.needsContinuousTime && Boolean(task.isFragmentFriendly),
    }))
    .sort(sortUpdated);
}

export function normalizeEvents(records: CalendarEvent[]) {
  return records
    .filter(active)
    .map((event) => ({ ...event, location: event.location ?? null }))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function normalizeProjects(records: Project[], nodes: ProjectNode[]) {
  const projectIdsWithNodes = new Set(nodes.filter(active).map((node) => node.projectId));
  return records
    .filter(active)
    .map((project) => ({
      ...project,
      initializationState:
        project.initializationState ??
        (projectIdsWithNodes.has(project.id) ? "ready" : "draft"),
      plannedStartDate: project.plannedStartDate ?? null,
      plannedEndDate: project.plannedEndDate ?? null,
    }))
    .sort((a, b) => a.order - b.order);
}

export function normalizeProjectNodes(records: ProjectNode[]) {
  return records
    .filter(active)
    .map((node) => ({
      ...node,
      needsContinuousTime: Boolean(node.needsContinuousTime),
      isFragmentFriendly: !node.needsContinuousTime && Boolean(node.isFragmentFriendly),
    }))
    .sort((a, b) => a.order - b.order);
}

export function normalizeSettings(record?: PlannerSettings) {
  const genuineMemos = (record?.memoItems ?? []).filter(
    (m) => m?.text && m.text.trim() !== "随时记录突然想到的事情" && m.text.trim() !== "之后一直要记得的事情",
  );
  return {
    ...DEFAULT_SETTINGS,
    ...(record ?? {}),
    itemTypes: normalizeItemTypes(record?.itemTypes),
    lastProjectByGoal: record?.lastProjectByGoal ?? {},
    sleepOverrides: record?.sleepOverrides ?? {},
    memoItems: genuineMemos.length > 0 ? genuineMemos : DEFAULT_MEMO_ITEMS,
  };
}

export function operationFor(
  entity: PlannerEntity,
  baseVersion: number,
  action: SyncOperation["action"] = "upsert",
  patch?: Record<string, unknown> | Partial<PlannerEntity>,
): SyncOperation {
  return {
    id: newId("op"),
    entityType: entity.entityType,
    entityId: entity.id,
    action,
    baseVersion,
    patch: (patch ?? entity) as Record<string, unknown>,
    createdAt: nowIso(),
    status: "pending",
  };
}

export async function putConflictRecordInDatabase(
  db: PlannerDatabase,
  entityType: SyncConflict["entityType"],
  record: Record<string, unknown>,
) {
  if (entityType === "thought") await db.thoughts.put(record as unknown as QuickThought);
  if (entityType === "task") await db.tasks.put(record as unknown as PlannerTask);
  if (entityType === "event") await db.events.put(record as unknown as CalendarEvent);
  if (entityType === "goal") await db.goals.put(record as unknown as Goal);
  if (entityType === "project") await db.projects.put(record as unknown as Project);
  if (entityType === "projectNode") await db.projectNodes.put(record as unknown as ProjectNode);
  if (entityType === "scheduleBlock") await db.scheduleBlocks.put(record as unknown as ScheduleBlock);
  if (entityType === "fragmentActivity") await db.fragmentActivities.put(record as unknown as FragmentActivity);
  if (entityType === "notification") await db.notifications.put(record as unknown as MissedNotification);
  if (entityType === "originLink") await db.originLinks.put(record as unknown as OriginLink);
  if (entityType === "aiRun") await db.aiRuns.put(record as unknown as AiRun);
  if (entityType === "settings") await db.settings.put(record as unknown as PlannerSettings);
}

export async function putConflictRecord(
  entityType: SyncConflict["entityType"],
  record: Record<string, unknown>,
) {
  await putConflictRecordInDatabase(getPlannerDb(), entityType, record);
}

export function makeActivity(
  id: string,
  title: string,
  eligibleMinutes: FragmentMinutes[],
  time: string,
): FragmentActivity {
  return {
    id,
    entityType: "fragmentActivity",
    title,
    eligibleMinutes,
    enabled: true,
    createdAt: time,
    updatedAt: time,
    version: 1,
  };
}

export function legacyReminder(offsetMinutes?: number | null): ReminderRule[] {
  return offsetMinutes == null
    ? []
    : [{ id: newId("reminder"), offsetMinutes, anchor: "start" }];
}

export function active<T extends { deletedAt?: string | null }>(entity: T) {
  return !entity.deletedAt;
}

export function sortUpdated<T extends { updatedAt: string }>(a: T, b: T): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function sortBlocks(a: ScheduleBlock, b: ScheduleBlock): number {
  return `${a.date}${a.startAt ?? ""}`.localeCompare(`${b.date}${b.startAt ?? ""}`);
}

export function depthOf(node: ProjectNode, nodes: ProjectNode[]): number {
  let depth = 0;
  let parentId = node.parentId;
  while (parentId) {
    depth += 1;
    parentId = nodes.find((item) => item.id === parentId)?.parentId ?? null;
  }
  return depth;
}
