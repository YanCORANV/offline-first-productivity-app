import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  DEFAULT_ITEM_TYPES,
  newId,
  nowIso,
  type AiRun,
  type FragmentActivity,
  type FragmentMinutes,
  type MissedNotification,
  type PlannerSettings,
  type PlannerTask,
  type SyncOperation,
} from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { operationFor, putConflictRecord, putConflictRecordInDatabase } from "./internals";

export function useSupportMutations({
  tasks,
  setTasks,
  settingsRef,
  setSettings,
  enqueue,
  kickSync,
}: {
  tasks: PlannerTask[];
  setTasks: Dispatch<SetStateAction<PlannerTask[]>>;
  settingsRef: { current: PlannerSettings };
  setSettings: Dispatch<SetStateAction<PlannerSettings>>;
  enqueue: (operation: SyncOperation) => Promise<void>;
  kickSync: () => void;
}) {
  const addFragmentActivity = useCallback(
    async (title: string, eligibleMinutes: FragmentMinutes[]) => {
      const time = nowIso();
      const activity: FragmentActivity = {
        id: newId("activity"),
        entityType: "fragmentActivity",
        title: title.trim(),
        eligibleMinutes,
        enabled: true,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      await getPlannerDb().fragmentActivities.put(activity);
      await enqueue(operationFor(activity, 0));
      kickSync();
      return activity;
    },
    [enqueue, kickSync],
  );

  const updateFragmentActivity = useCallback(
    async (id: string, patch: Partial<FragmentActivity>) => {
      const db = getPlannerDb();
      const current = await db.fragmentActivities.get(id);
      if (!current) return;
      const nextPatch = { ...patch, updatedAt: nowIso(), version: current.version + 1 };
      await db.fragmentActivities.update(id, nextPatch);
      await enqueue(operationFor({ ...current, ...nextPatch }, current.version, "upsert", nextPatch));
      kickSync();
    },
    [enqueue, kickSync],
  );

  const deleteFragmentActivity = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = await db.fragmentActivities.get(id);
      if (!current) return;
      const time = nowIso();
      const patch: Partial<FragmentActivity> = {
        title: "",
        enabled: false,
        deletedAt: time,
        updatedAt: time,
        version: current.version + 1,
      };
      await db.fragmentActivities.update(id, patch);
      await enqueue(operationFor({ ...current, ...patch }, current.version, "delete", patch));
      kickSync();
    },
    [enqueue, kickSync],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = await db.notifications.get(id);
      if (!current) return;
      const patch: Partial<MissedNotification> = {
        readAt: nowIso(),
        updatedAt: nowIso(),
        version: current.version + 1,
      };
      await db.notifications.update(id, patch);
      await enqueue(operationFor({ ...current, ...patch }, current.version, "upsert", patch));
      kickSync();
    },
    [enqueue, kickSync],
  );

  const saveSettings = useCallback(
    async (patch: Partial<PlannerSettings>) => {
      const db = getPlannerDb();
      const currentStored = await db.settings.get("main");
      const current = currentStored ?? settingsRef.current;
      const next = { ...current, ...patch, id: "main" as const, version: current.version + 1 };
      settingsRef.current = next;
      setSettings(next);
      const operation: SyncOperation = {
        id: newId("op"),
        entityType: "settings",
        entityId: "main",
        action: "upsert",
        baseVersion: current.version,
        patch: patch as unknown as Record<string, unknown>,
        createdAt: nowIso(),
        status: "pending",
      };
      try {
        await db.transaction("rw", [db.settings, db.operations], async () => {
          await db.settings.put(next);
          await db.operations.put(operation);
        });
        kickSync();
      } catch (error) {
        settingsRef.current = current;
        setSettings(current);
        throw error;
      }
    },
    [kickSync, setSettings, settingsRef],
  );

  const removeItemType = useCallback(
    async (typeId: string) => {
      if (DEFAULT_ITEM_TYPES.some((item) => item.id === typeId)) return;
      const currentSettings = settingsRef.current;
      if (!currentSettings.itemTypes.some((item) => item.id === typeId)) return;
      const fallbackTypeId = currentSettings.itemTypes.some((item) => item.id === "research")
        ? "research"
        : DEFAULT_ITEM_TYPES[0].id;
      const affectedTasks = tasks.filter((task) => task.itemTypeId === typeId);
      const nextSettings = {
        ...currentSettings,
        itemTypes: currentSettings.itemTypes.filter((item) => item.id !== typeId),
        id: "main" as const,
        version: currentSettings.version + 1,
      };
      const time = nowIso();
      const nextTasks = affectedTasks.map((task) => ({
        ...task,
        itemTypeId: fallbackTypeId,
        updatedAt: time,
        version: task.version + 1,
      }));
      const operations: SyncOperation[] = [
        {
          id: newId("op"),
          entityType: "settings",
          entityId: "main",
          action: "upsert",
          baseVersion: currentSettings.version,
          patch: nextSettings as unknown as Record<string, unknown>,
          createdAt: time,
          status: "pending",
        },
        ...nextTasks.map((task, index) =>
          operationFor(task, affectedTasks[index].version, "upsert", {
            itemTypeId: fallbackTypeId,
            updatedAt: task.updatedAt,
            version: task.version,
          }),
        ),
      ];
      const db = getPlannerDb();
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      setTasks((items) => items.map((item) => nextTasks.find((next) => next.id === item.id) ?? item));
      try {
        await db.transaction("rw", [db.settings, db.tasks, db.operations], async () => {
          await db.settings.put(nextSettings);
          await db.tasks.bulkPut(nextTasks);
          await db.operations.bulkPut(operations);
        });
        kickSync();
      } catch (error) {
        settingsRef.current = currentSettings;
        setSettings(currentSettings);
        setTasks((items) => items.map((item) => affectedTasks.find((current) => current.id === item.id) ?? item));
        throw error;
      }
    },
    [kickSync, setSettings, setTasks, settingsRef, tasks],
  );

  const saveAiRun = useCallback(async (run: AiRun) => {
    await getPlannerDb().aiRuns.put(run);
  }, []);

  const resolveConflict = useCallback(
    async (id: string, resolution: "local" | "server") => {
      const db = getPlannerDb();
      const conflict = await db.conflicts.get(id);
      if (!conflict) return;
      const serverVersion = Number(conflict.serverRecord.version ?? 0);
      const resolvedRecord = resolution === "local"
        ? { ...conflict.serverRecord, ...conflict.localPatch, version: serverVersion }
        : conflict.serverRecord;
      await putConflictRecord(conflict.entityType, resolvedRecord);
      await db.operations.delete(conflict.operationId);
      await db.conflicts.delete(id);
      if (resolution === "local") {
        await enqueue({
          id: newId("op"),
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          action: "upsert",
          baseVersion: serverVersion,
          patch: conflict.localPatch,
          createdAt: nowIso(),
          status: "pending",
        });
      }
      kickSync();
    },
    [enqueue, kickSync],
  );

  const resolveAllConflicts = useCallback(
    async (resolution: "local" | "server") => {
      const db = getPlannerDb();
      const conflicts = await db.conflicts.toArray();
      if (!conflicts.length) return 0;
      const groups = new Map<string, typeof conflicts>();
      for (const conflict of conflicts) {
        const key = `${conflict.entityType}:${conflict.entityId}`;
        const group = groups.get(key) ?? [];
        group.push(conflict);
        groups.set(key, group);
      }
      const tables = [
        db.thoughts,
        db.tasks,
        db.events,
        db.goals,
        db.projects,
        db.projectNodes,
        db.scheduleBlocks,
        db.fragmentActivities,
        db.notifications,
        db.originLinks,
        db.aiRuns,
        db.settings,
        db.operations,
        db.conflicts,
      ];
      await db.transaction("rw", tables, async () => {
        for (const group of groups.values()) {
          const ordered = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const conflict = ordered[ordered.length - 1];
          const serverVersion = Math.max(
            ...ordered.map((item) => Number(item.serverRecord.version ?? 0)),
          );
          const mergedPatch = Object.assign({}, ...ordered.map((item) => item.localPatch));
          const resolvedRecord = resolution === "local"
            ? { ...conflict.serverRecord, ...mergedPatch, version: serverVersion }
            : conflict.serverRecord;
          await putConflictRecordInDatabase(db, conflict.entityType, resolvedRecord);
          await db.operations.bulkDelete(ordered.map((item) => item.operationId));
          if (resolution === "local") {
            await db.operations.put({
              id: newId("op"),
              entityType: conflict.entityType,
              entityId: conflict.entityId,
              action: "upsert",
              baseVersion: serverVersion,
              patch: mergedPatch,
              createdAt: nowIso(),
              status: "pending",
            });
          }
          await db.conflicts.bulkDelete(ordered.map((item) => item.id));
        }
      });
      kickSync();
      return conflicts.length;
    },
    [kickSync],
  );

  return {
    addFragmentActivity,
    updateFragmentActivity,
    deleteFragmentActivity,
    markNotificationRead,
    saveSettings,
    removeItemType,
    saveAiRun,
    resolveConflict,
    resolveAllConflicts,
  };
}
