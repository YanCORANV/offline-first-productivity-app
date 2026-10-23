import { liveQuery } from "dexie";
import type {
  AiRun,
  CalendarEvent,
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
} from "@/lib/domain";
import { DEFAULT_ITEM_TYPES, DEFAULT_MEMO_ITEMS, DEFAULT_SETTINGS, nowIso } from "@/lib/domain";
import { seedDemoDataIfEmpty } from "@/lib/demo-seed";
import { getPlannerDb } from "@/lib/local-db";
import {
  normalizeEvents,
  normalizeProjectNodes,
  normalizeProjects,
  normalizeSettings,
  normalizeTasks,
  active,
  makeActivity,
  sortBlocks,
  sortUpdated,
} from "./internals";

type PlannerStorageListeners = {
  onThoughts: (records: QuickThought[]) => void;
  onTasks: (records: PlannerTask[]) => void;
  onEvents: (records: CalendarEvent[]) => void;
  onGoals: (records: Goal[]) => void;
  onProjects: (records: Project[]) => void;
  onProjectNodes: (records: ProjectNode[]) => void;
  onScheduleBlocks: (records: ScheduleBlock[]) => void;
  onFragmentActivities: (records: FragmentActivity[]) => void;
  onNotifications: (records: MissedNotification[]) => void;
  onOriginLinks: (records: OriginLink[]) => void;
  onAiRuns: (records: AiRun[]) => void;
  onSettings: (settings: PlannerSettings) => void;
  onConflicts: (records: SyncConflict[]) => void;
};

export async function readPlannerSnapshot() {
  const db = getPlannerDb();
  const [thoughts, tasks, events, goals, projects, projectNodes, scheduleBlocks, settings] = await Promise.all([
    db.thoughts.toArray(),
    db.tasks.toArray(),
    db.events.toArray(),
    db.goals.toArray(),
    db.projects.toArray(),
    db.projectNodes.toArray(),
    db.scheduleBlocks.toArray(),
    db.settings.get("main"),
  ]);
  return {
    thoughts: thoughts.filter(active).sort(sortUpdated),
    tasks: normalizeTasks(tasks),
    events: normalizeEvents(events),
    goals: goals.filter(active).sort((a, b) => a.order - b.order),
    projects: normalizeProjects(projects, projectNodes),
    projectNodes: normalizeProjectNodes(projectNodes),
    scheduleBlocks: scheduleBlocks.filter(active).sort(sortBlocks),
    settings: normalizeSettings(settings),
  } satisfies {
    thoughts: QuickThought[];
    tasks: PlannerTask[];
    events: CalendarEvent[];
    goals: Goal[];
    projects: Project[];
    projectNodes: ProjectNode[];
    scheduleBlocks: ScheduleBlock[];
    settings: PlannerSettings;
  };
}

export async function preparePlannerStorage() {
  const db = getPlannerDb();
  await db.operations
    .where("status")
    .equals("syncing")
    .modify({ status: "pending" })
    .catch(() => undefined);

  // If a conflict was recorded for settings, restore authoritative serverRecord
  const conflicts = await db.conflicts.toArray().catch(() => []);
  for (const conflict of conflicts) {
    if (conflict.entityType === "settings" && conflict.serverRecord) {
      const serverSettings = normalizeSettings(conflict.serverRecord as unknown as PlannerSettings);
      if (serverSettings.itemTypes && serverSettings.itemTypes.length > DEFAULT_ITEM_TYPES.length) {
        await db.settings.put(serverSettings).catch(() => undefined);
      }
      if (conflict.operationId) {
        await db.operations.delete(conflict.operationId).catch(() => undefined);
      }
      await db.conflicts.delete(conflict.id).catch(() => undefined);
    }
  }

  const storedSettings = await db.settings.get("main");

  await db.operations
    .where("status")
    .equals("conflict")
    .delete()
    .catch(() => undefined);

  // Purge any operations that have exceeded retry limit, have invalid structure, or are dummy memo saves
  const allOps = await db.operations.toArray().catch(() => []);
  const staleOpIds = allOps
    .filter((op) => {
      if ((op.retryCount ?? 0) >= 5 || !op.id || !op.entityType) return true;
      if (op.entityType === "settings") {
        const patch = op.patch as Record<string, unknown> | undefined;
        if (patch && "memoItems" in patch) {
          const memos = patch.memoItems;
          if (!Array.isArray(memos) || memos.length === 0) return true;
          return memos.every((m: unknown) => {
            if (!m || typeof m !== "object" || !("text" in m) || typeof (m as { text: unknown }).text !== "string") return true;
            const text = (m as { text: string }).text.trim();
            return text === "随时记录突然想到的事情" || text === "之后一直要记得的事情";
          });
        }
      }
      return false;
    })
    .map((op) => op.id);
  if (staleOpIds.length) {
    await db.operations.bulkDelete(staleOpIds).catch(() => undefined);
  }

  // Inspect existing settings and localStorage for genuine custom memos
  let genuineMemos = (storedSettings?.memoItems ?? []).filter(
    (m) => m?.text && m.text.trim() !== "随时记录突然想到的事情" && m.text.trim() !== "之后一直要记得的事情",
  );

  if (!genuineMemos.length && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("yans_plan_sidebar_memo_items_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          genuineMemos = parsed.filter(
            (m) => m?.text && m.text.trim() !== "随时记录突然想到的事情" && m.text.trim() !== "之后一直要记得的事情",
          );
        }
      }
    } catch {}

    if (!genuineMemos.length) {
      try {
        const legacyRaw = localStorage.getItem("yans_plan_sidebar_memo_v1");
        if (legacyRaw && legacyRaw.trim()) {
          const lines = legacyRaw.split("\n").filter((l) => l.trim().length > 0);
          genuineMemos = lines
            .map((line, idx) => {
              const isCompleted = /^\s*[-*]\s*\[[xX]\]/.test(line);
              const text = line.replace(/^\s*[-*](\s*\[[ xX]\])?\s*/, "").trim();
              return {
                id: `memo-legacy-${idx}-${text.slice(0, 10)}`,
                text,
                completed: isCompleted,
              };
            })
            .filter((item) => item.text.length > 0 && item.text !== "随时记录突然想到的事情" && item.text !== "之后一直要记得的事情");
        }
      } catch {}
    }
  }

  if (!genuineMemos.length) {
    genuineMemos = [...DEFAULT_MEMO_ITEMS];
  }

  if (genuineMemos.length > 0) {
    await db.settings.update("main", { memoItems: genuineMemos }).catch(() => undefined);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("yans_plan_sidebar_memo_items_v1", JSON.stringify(genuineMemos));
      }
    } catch {}

    const pendingSettingsOp = await db.operations
      .where("entityType")
      .equals("settings")
      .and((op) => op.status === "pending")
      .first()
      .catch(() => null);

    if (!pendingSettingsOp) {
      const curSettings = await db.settings.get("main");
      await db.operations.put({
        id: `op-memo-${Date.now()}`,
        entityType: "settings",
        entityId: "main",
        action: "upsert",
        baseVersion: curSettings?.version ?? 0,
        patch: { memoItems: genuineMemos },
        createdAt: nowIso(),
        status: "pending",
      }).catch(() => undefined);
    }
  } else if (storedSettings?.memoItems && storedSettings.memoItems.length > 0) {
    const onlyDummy = storedSettings.memoItems.every(
      (m) => m?.text && (m.text.trim() === "随时记录突然想到的事情" || m.text.trim() === "之后一直要记得的事情"),
    );
    if (onlyDummy) {
      await db.settings.update("main", { memoItems: [] }).catch(() => undefined);
    }
  }

  if (!storedSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  } else if (!storedSettings.itemTypes || !Array.isArray(storedSettings.itemTypes) || storedSettings.itemTypes.length === 0) {
    await db.settings.update("main", { itemTypes: DEFAULT_ITEM_TYPES });
  }
  await seedDemoDataIfEmpty(db).catch(() => undefined);

  if (!(await db.fragmentActivities.count())) {
    const time = nowIso();
    await db.fragmentActivities.bulkPut([
      makeActivity("activity_default_inbox", "整理 Inbox", [15, 30], time),
      makeActivity("activity_default_read", "阅读", [15, 30, 60], time),
      makeActivity("activity_default_rest", "休息片刻", [15, 30, 60, 90], time),
    ]);
  }
}

export function subscribeToPlannerStorage(listeners: PlannerStorageListeners) {
  const db = getPlannerDb();
  const subscriptions = [
    liveQuery(() => db.thoughts.toArray()).subscribe((records) =>
      listeners.onThoughts(records.filter(active).sort(sortUpdated)),
    ),
    liveQuery(() => db.tasks.toArray()).subscribe((records) =>
      listeners.onTasks(normalizeTasks(records)),
    ),
    liveQuery(() => db.events.toArray()).subscribe((records) =>
      listeners.onEvents(normalizeEvents(records)),
    ),
    liveQuery(() => db.goals.toArray()).subscribe((records) =>
      listeners.onGoals(records.filter(active).sort((a, b) => a.order - b.order)),
    ),
    liveQuery(() => Promise.all([db.projects.toArray(), db.projectNodes.toArray()])).subscribe(
      ([projects, nodes]) => {
        listeners.onProjects(normalizeProjects(projects, nodes));
        listeners.onProjectNodes(normalizeProjectNodes(nodes));
      },
    ),
    liveQuery(() => db.scheduleBlocks.toArray()).subscribe((records) =>
      listeners.onScheduleBlocks(records.filter(active).sort(sortBlocks)),
    ),
    liveQuery(() => db.fragmentActivities.toArray()).subscribe((records) =>
      listeners.onFragmentActivities(records.filter(active).sort(sortUpdated)),
    ),
    liveQuery(() => db.notifications.toArray()).subscribe((records) =>
      listeners.onNotifications(records.filter(active).sort(sortUpdated)),
    ),
    liveQuery(() => db.originLinks.toArray()).subscribe((records) =>
      listeners.onOriginLinks(records.filter(active).sort(sortUpdated)),
    ),
    liveQuery(() => db.aiRuns.toArray()).subscribe((records) =>
      listeners.onAiRuns(records.filter(active).sort(sortUpdated)),
    ),
    liveQuery(() => db.settings.get("main")).subscribe((record) =>
      listeners.onSettings(normalizeSettings(record)),
    ),
    liveQuery(() => db.conflicts.toArray()).subscribe((records) =>
      listeners.onConflicts(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    ),
  ];
  return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
}
