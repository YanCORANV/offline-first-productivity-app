"use client";

import type {
  AiRun,
  CalendarEvent,
  CloudChange,
  FragmentActivity,
  Goal,
  MissedNotification,
  OriginLink,
  PlannerSettings,
  PlannerTask,
  Project,
  ProjectNode,
  QuickThought,
  ScheduleBlock,
  SyncConflict,
  SyncOperation,
} from "./domain";
import { normalizeFragmentMinutes } from "./domain";
import { getPlannerDb } from "./local-db";
import { shouldApplyCloudRecord } from "./sync-version";

export type SyncState = "starting" | "synced" | "syncing" | "offline" | "unconfigured" | "error";

type VersionedCloudRecord = { id: string; version?: number };

interface PushResponse {
  acknowledged: string[];
  conflicts: SyncConflict[];
  changes?: CloudChange[];
  cursor?: number;
}

interface PullResponse {
  changes: CloudChange[];
  cursor: number;
}

const CLOUD_SYNC_LOCK = "quiet-plan-cloud-sync";
type CloudStoreName =
  | "thoughts"
  | "tasks"
  | "events"
  | "goals"
  | "projects"
  | "projectNodes"
  | "scheduleBlocks"
  | "fragmentActivities"
  | "notifications"
  | "originLinks"
  | "aiRuns"
  | "settings";

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function isDummyMemo(text?: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  return trimmed === "随时记录突然想到的事情" || trimmed === "之后一直要记得的事情";
}

function filterGenuineMemos(items?: PlannerSettings["memoItems"]): NonNullable<PlannerSettings["memoItems"]> {
  if (!items || !Array.isArray(items)) return [];
  return items.filter((item) => item?.text && !isDummyMemo(item.text));
}

function mergeSettingsMemos(
  local?: PlannerSettings["memoItems"],
  incoming?: PlannerSettings["memoItems"],
): NonNullable<PlannerSettings["memoItems"]> {
  const cleanLocal = filterGenuineMemos(local);
  const cleanInc = filterGenuineMemos(incoming);
  const seen = new Set<string>();
  const merged: NonNullable<PlannerSettings["memoItems"]> = [];
  for (const item of cleanInc) {
    const key = item.text.trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  for (const item of cleanLocal) {
    const key = item.text.trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

export async function applyCloudChanges(changes: CloudChange[]): Promise<void> {
  if (!changes.length) return;
  const db = getPlannerDb();
  const recordsByStore = new Map<CloudStoreName, unknown[]>();
  const entityTypes = new Map<CloudStoreName, string>();
  for (const change of changes) {
    const normalized = normalizeCloudChange(change);
    if (!normalized) continue;
    const records = recordsByStore.get(normalized.storeName) ?? [];
    records.push(normalized.record);
    recordsByStore.set(normalized.storeName, records);
    entityTypes.set(normalized.storeName, change.entityType);
  }

  if (!recordsByStore.size) return;
  const tables = [
    ...[...recordsByStore.keys()].map((storeName) => db.table(storeName)),
    db.operations,
  ];
  await db.transaction("rw", tables, async () => {
    // A failed upload must not let a download replace unsent local edits.
    const queued = await db.operations.toArray();
    const protectedIds = new Set(queued.map((operation) =>
      `${operation.entityType}:${operation.entityId}`,
    ));
    for (const [storeName, records] of recordsByStore) {
      const table = db.table(storeName);
      const incoming = records as VersionedCloudRecord[];
      const current = await table.bulkGet(incoming.map((record) => record.id));
      const applicable = incoming.filter((record, index) => {
        if (storeName === "settings") {
          const curSettings = current[index] as PlannerSettings | undefined;
          const incSettings = record as PlannerSettings;
          const curCount = curSettings?.itemTypes?.length ?? 0;
          const incCount = incSettings?.itemTypes?.length ?? 0;
          if (incCount > curCount && curCount <= 5) {
            return true;
          }
          const curGenuine = filterGenuineMemos(curSettings?.memoItems);
          const incGenuine = filterGenuineMemos(incSettings?.memoItems);
          if (incGenuine.length > 0 && incGenuine.some((inc) => !curGenuine.some((cur) => cur.text.trim() === inc.text.trim()))) {
            return true;
          }
        }
        if (protectedIds.has(`${entityTypes.get(storeName)}:${record.id}`)) {
          return false;
        }
        return shouldApplyCloudRecord(current[index], record);
      }).map((record) => {
        if (storeName === "settings") {
          const cur = current.find((item) => item?.id === record.id) as PlannerSettings | undefined;
          const inc = record as PlannerSettings;
          const mergedMemoItems = mergeSettingsMemos(cur?.memoItems, inc.memoItems);
          return {
            ...inc,
            memoItems: mergedMemoItems,
            cloudCursor: cur?.cloudCursor ?? 0,
          };
        }
        return record;
      });
      if (applicable.length) await table.bulkPut(applicable);
    }
  });
}

export async function synchronize(
  settings: PlannerSettings,
): Promise<{ state: SyncState; cursor: number; message?: string }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { state: "offline", cursor: settings.cloudCursor };
  }

  if (navigator.locks) {
    return navigator.locks.request(CLOUD_SYNC_LOCK, () => synchronizeUnlocked(settings));
  }
  return synchronizeUnlocked(settings);
}

async function synchronizeUnlocked(
  settings: PlannerSettings,
): Promise<{ state: SyncState; cursor: number; message?: string }> {
  const db = getPlannerDb();
  const operations = await db.operations.where("status").equals("pending").sortBy("createdAt");
  const storedSettings = await db.settings.get("main");
  let cursor = storedSettings?.cloudCursor ?? settings.cloudCursor;
  let uploadError: string | undefined;

  try {
    if (operations.length) {
      await db.operations.bulkUpdate(
        operations.map((operation) => ({
          key: operation.id,
          changes: { status: "syncing" },
        })),
      );
      const response = await fetchWithTimeout("/api/sync/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operations, cursor }),
      });
      if (response.status === 503) {
        await resetOperations(operations);
        return { state: "unconfigured", cursor };
      }
      if (!response.ok) {
        let msg = `同步写入失败（${response.status}）`;
        try {
          const errData = (await response.json()) as { message?: string };
          if (errData?.message) {
            msg = `${errData.message}（${response.status}）`;
          }
        } catch {
          // ignore
        }
        if (response.status === 400) {
          console.warn("[sync] Operations rejected with 400 Bad Request, discarding:", operations);
          await db.operations.bulkDelete(operations.map((op) => op.id));
        }
        throw new Error(msg);
      }
      const result = (await response.json()) as PushResponse;
      await db.transaction("rw", db.operations, db.conflicts, async () => {
        await db.operations.bulkDelete(result.acknowledged ?? []);
        if (result.conflicts?.length) {
          await db.conflicts.bulkPut(result.conflicts);
          await db.operations.bulkUpdate(
            result.conflicts.map((conflict) => ({
              key: conflict.operationId,
              changes: { status: "conflict" },
            })),
          );
        }
      });
      await applyCloudChanges(result.changes ?? []);
      if (typeof result.cursor === "number") cursor = result.cursor;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "同步上传暂时不可用";
    if (operations.length) await resetOperations(operations, errorMsg);
    uploadError = errorMsg;
  }

  try {
    let hasMore = true;
    while (hasMore) {
      const previousCursor = cursor;
      const pull = await fetchWithTimeout(`/api/sync/pull?cursor=${cursor}`, {
        headers: { accept: "application/json" },
      });
      if (pull.status === 503) {
        return { state: "unconfigured", cursor };
      }
      if (!pull.ok) {
        let msg = `同步读取失败（${pull.status}）`;
        try {
          const errData = (await pull.json()) as { message?: string };
          if (errData?.message) msg = `${errData.message}（${pull.status}）`;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const pulled = ((await pull.json()) || {}) as PullResponse;
      const changes = Array.isArray(pulled.changes) ? pulled.changes : [];
      await applyCloudChanges(changes);
      cursor = typeof pulled.cursor === "number" ? pulled.cursor : cursor;
      // Commit each page so interrupted recovery resumes from its last page.
      await db.settings.update("main", { cloudCursor: cursor });
      hasMore = Boolean(changes.length) && cursor > previousCursor;
      if (pulled.changes?.length) {
        console.info(`[sync] Applied ${pulled.changes.length} changes; cursor ${cursor}`);
      }
    }
    return uploadError
      ? { state: "error", cursor, message: `${uploadError}；已下载云端更新，本机改动保留待重试` }
      : { state: "synced", cursor };
  } catch (error) {
    return {
      state: "error",
      cursor,
      message: [uploadError, error instanceof Error ? error.message : "同步暂时不可用"]
        .filter(Boolean).join("；"),
    };
  }
}

async function resetOperations(operations: SyncOperation[], errorMessage?: string): Promise<void> {
  const db = getPlannerDb();
  const current = await db.operations.bulkGet(operations.map((operation) => operation.id));
  const toUpdate: { key: string; changes: Partial<SyncOperation> }[] = [];
  const toDelete: string[] = [];

  for (const op of current) {
    if (!op || op.status !== "syncing") continue;
    const retries = (op.retryCount ?? 0) + 1;
    if (retries >= 5) {
      console.warn("[sync] Operation exceeded retry threshold (5), dropping to unblock sync:", op);
      toDelete.push(op.id);
    } else {
      toUpdate.push({
        key: op.id,
        changes: {
          status: "pending",
          retryCount: retries,
          error: errorMessage ?? null,
        },
      });
    }
  }

  if (toDelete.length) await db.operations.bulkDelete(toDelete);
  if (toUpdate.length) await db.operations.bulkUpdate(toUpdate);
}

function normalizeCloudChange(
  change: CloudChange,
): { storeName: CloudStoreName; record: unknown } | null {
  const record = change.record;
  if (change.entityType === "thought") {
    const thought = record as unknown as QuickThought;
    return {
      storeName: "thoughts",
      record: {
        ...thought,
        status: thought.status === "someday" ? "inbox" : thought.status,
        processedAt: thought.status === "someday" ? null : thought.processedAt,
      },
    };
  }
  if (change.entityType === "task") {
    const task = record as unknown as PlannerTask;
    return {
      storeName: "tasks",
      record: {
        ...task,
        planningState: task.planningState ?? "planned",
        needsContinuousTime: Boolean(task.needsContinuousTime),
        isFragmentFriendly: Boolean(task.isFragmentFriendly),
      },
    };
  }
  if (change.entityType === "event") {
    const event = record as unknown as CalendarEvent;
    return {
      storeName: "events",
      record: {
        ...event,
        location: event.location ?? null,
        excludedOccurrenceKeys: event.excludedOccurrenceKeys ?? [],
      },
    };
  }
  if (change.entityType === "goal") {
    return { storeName: "goals", record: record as unknown as Goal };
  }
  if (change.entityType === "project") {
    const project = record as unknown as Project;
    return {
      storeName: "projects",
      record: {
        ...project,
        initializationState: project.initializationState ?? "ready",
        plannedStartDate: project.plannedStartDate ?? null,
        plannedEndDate: project.plannedEndDate ?? null,
        importCheckpoint: null,
      },
    };
  }
  if (change.entityType === "projectNode") {
    const node = record as unknown as ProjectNode;
    return {
      storeName: "projectNodes",
      record: {
        ...node,
        needsContinuousTime: Boolean(node.needsContinuousTime),
        isFragmentFriendly: Boolean(node.isFragmentFriendly),
      },
    };
  }
  if (change.entityType === "scheduleBlock") {
    return { storeName: "scheduleBlocks", record: record as unknown as ScheduleBlock };
  }
  if (change.entityType === "fragmentActivity") {
    const activity = record as unknown as FragmentActivity & {
      durationBucket?: "10" | "30" | "60" | "long";
    };
    return {
      storeName: "fragmentActivities",
      record: {
        ...activity,
        eligibleMinutes: normalizeFragmentMinutes(
          activity.eligibleMinutes,
          activity.durationBucket,
        ),
      },
    };
  }
  if (change.entityType === "notification") {
    return { storeName: "notifications", record: record as unknown as MissedNotification };
  }
  if (change.entityType === "originLink") {
    return { storeName: "originLinks", record: record as unknown as OriginLink };
  }
  if (change.entityType === "aiRun") {
    return { storeName: "aiRuns", record: record as unknown as AiRun };
  }
  if (change.entityType === "settings") {
    const nextSettings = record as unknown as PlannerSettings;
    return {
      storeName: "settings",
      record: {
        ...nextSettings,
        defaultWakeTime: nextSettings.defaultWakeTime ?? "08:00",
        defaultSleepTime: nextSettings.defaultSleepTime ?? "00:30",
        calendarDisplayStart: nextSettings.calendarDisplayStart ?? "08:00",
        calendarDisplayEnd: nextSettings.calendarDisplayEnd ?? "02:00",
        sleepOverrides: nextSettings.sleepOverrides ?? {},
      },
    };
  }
  return null;
}
