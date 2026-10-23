"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  type AiRun,
  type CalendarEvent,
  type FragmentActivity,
  type Goal,
  type OriginLink,
  type PlannerSettings,
  type PlannerTask,
  type Project,
  type ProjectNode,
  type QuickThought,
  type ScheduleBlock,
  type SyncConflict,
  type MissedNotification,
} from "@/lib/domain";
import type { PlannerContextValue } from "./planner-provider/contracts";
import { useScheduleBlockMutations } from "./planner-provider/schedule-mutations";
import {
  preparePlannerStorage,
  readPlannerSnapshot,
  subscribeToPlannerStorage,
} from "./planner-provider/initialization";
import { useSupportMutations } from "./planner-provider/support-mutations";
import { useItemMutations } from "./planner-provider/item-mutations";
import { useProjectMutations } from "./planner-provider/project-mutations";
import { useSyncController } from "./planner-provider/sync-controller";
import { useWidgetBridge } from "./planner-provider/widget-bridge";
import { useReminderEngine } from "./planner-provider/reminder-engine";

export type {
  NewEventInput,
  NewScheduleBlockInput,
  NewTaskInput,
  PlannerContextValue,
} from "./planner-provider/contracts";

const PlannerContext = createContext<PlannerContextValue | null>(null);

function retainMatchingRecords<T extends { id: string; version: number; updatedAt?: string }>(
  current: T[],
  next: T[],
): T[] {
  if (
    current.length === next.length &&
    current.every((item, index) =>
      item.id === next[index]?.id && item.version === next[index]?.version &&
      item.updatedAt === next[index]?.updatedAt,
    )
  ) {
    return current;
  }
  return next;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [thoughts, setThoughts] = useState<QuickThought[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectNodes, setProjectNodes] = useState<ProjectNode[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [fragmentActivities, setFragmentActivities] = useState<FragmentActivity[]>([]);
  const [notifications, setNotifications] = useState<MissedNotification[]>([]);
  const [originLinks, setOriginLinks] = useState<OriginLink[]>([]);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const [settings, setSettings] = useState<PlannerSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<PlannerSettings>(DEFAULT_SETTINGS);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const refresh = useCallback(async () => {
    if (initialLoadComplete.current) return;
    const snapshot = await readPlannerSnapshot();
    setThoughts(snapshot.thoughts);
    setTasks(snapshot.tasks);
    setEvents(snapshot.events);
    setGoals(snapshot.goals);
    setProjects(snapshot.projects);
    setProjectNodes(snapshot.projectNodes);
    setScheduleBlocks(snapshot.scheduleBlocks);
    setSettings(snapshot.settings);
    initialLoadComplete.current = true;
  }, []);

  const { syncState, syncMessage, syncNow, enqueue, kickSync } = useSyncController({
    ready,
    cloudEnabled,
    settingsRef,
  });

  useEffect(() => {
    let cancelled = false;
    async function start() {
      await preparePlannerStorage().catch(() => undefined);
      await refresh();
      if (cancelled) return;
      setReady(true);
      void fetch("/api/status", { headers: { accept: "application/json" } })
        .then((response) => response.json())
        .then((status: { cloud?: string }) => {
          if (!cancelled) setCloudEnabled(status.cloud === "connected");
        })
        .catch(() => {
          if (!cancelled) setCloudEnabled(false);
        });
    }
    void start();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!ready || !initialLoadComplete.current) return;
    return subscribeToPlannerStorage({
      onThoughts: (records) => setThoughts((current) => retainMatchingRecords(current, records)),
      onTasks: (records) => setTasks((current) => retainMatchingRecords(current, records)),
      onEvents: (records) => setEvents((current) => retainMatchingRecords(current, records)),
      onGoals: (records) => setGoals((current) => retainMatchingRecords(current, records)),
      onProjects: (records) => setProjects((current) => retainMatchingRecords(current, records)),
      onProjectNodes: (records) => setProjectNodes((current) => retainMatchingRecords(current, records)),
      onScheduleBlocks: (records) => setScheduleBlocks((current) => retainMatchingRecords(current, records)),
      onFragmentActivities: (records) => setFragmentActivities((current) => retainMatchingRecords(current, records)),
      onNotifications: (records) => setNotifications((current) => retainMatchingRecords(current, records)),
      onOriginLinks: (records) => setOriginLinks((current) => retainMatchingRecords(current, records)),
      onAiRuns: (records) => setAiRuns((current) => retainMatchingRecords(current, records)),
      onSettings: (record) => setSettings((current) =>
        current.version === record.version &&
        current.cloudCursor === record.cloudCursor &&
        current.itemTypes.length === record.itemTypes.length &&
        JSON.stringify(current.memoItems ?? []) === JSON.stringify(record.memoItems ?? [])
          ? current
          : record,
      ),
      onConflicts: setConflicts,
    });
  }, [ready]);

  useWidgetBridge({
    ready,
    tasks,
    events,
    scheduleBlocks,
    projectNodes,
    settings,
  });

  useReminderEngine({
    ready,
    tasks,
    events,
    scheduleBlocks,
    settings,
  });

  const {
    addScheduleBlock,
    updateScheduleBlock,
    updateScheduleBlocks,
    deleteScheduleBlock,
  } = useScheduleBlockMutations({ scheduleBlocks, setScheduleBlocks, kickSync });

  const {
    addFragmentActivity,
    updateFragmentActivity,
    deleteFragmentActivity,
    markNotificationRead,
    saveSettings,
    removeItemType,
    saveAiRun,
    resolveConflict,
    resolveAllConflicts,
  } = useSupportMutations({ tasks, setTasks, settingsRef, setSettings, enqueue, kickSync });

  const {
    addOriginLinks,
    addThought,
    updateThoughtStatus,
    restoreThought,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    toggleTask,
    addEvent,
    updateEvent,
    deleteEvent,
    convertThoughtToDraft,
    convertThoughtsToTasks,
    convertThoughtsToEvents,
  } = useItemMutations({
    thoughts,
    tasks,
    events,
    settings,
    setThoughts,
    setTasks,
    setEvents,
    setScheduleBlocks,
    setOriginLinks,
    kickSync,
  });

  const {
    addGoal,
    updateGoal,
    deleteGoal,
    addProject,
    updateProject,
    deleteProject,
    addProjectNode,
    updateProjectNode,
    moveProjectNode,
    deleteProjectNode,
    toggleProjectNode,
    setProjectNodeFocus,
    duplicateProject,
    resumeProjectImport,
    importProjectOutline,
  } = useProjectMutations({
    goals,
    projects,
    projectNodes,
    scheduleBlocks,
    originLinks,
    setGoals,
    setProjects,
    setProjectNodes,
    setScheduleBlocks,
    setOriginLinks,
    addOriginLinks,
    kickSync,
  });

  const completeScheduleBlock = useCallback(
    async (id: string, scope: "block" | "item") => {
      const block = scheduleBlocks.find((item) => item.id === id);
      if (!block) return;
      const future = scope === "item"
        ? scheduleBlocks.filter(
            (candidate) =>
              candidate.sourceId === block.sourceId &&
              candidate.id !== id &&
              candidate.status === "planned",
          )
        : [];
      await updateScheduleBlocks([
        { id, patch: { status: "performed" } },
        ...future.map((candidate) => ({
          id: candidate.id,
          patch: { status: "skipped" as const, reminderRules: [] },
        })),
      ]);
      if (scope === "block") return;
      if (block.sourceType === "task") {
        const task = tasks.find((item) => item.id === block.sourceId);
        if (task?.status !== "completed") await toggleTask(block.sourceId);
      } else {
        const node = projectNodes.find((item) => item.id === block.sourceId);
        if (node?.status !== "completed") await toggleProjectNode(block.sourceId);
      }
    },
    [
      projectNodes,
      scheduleBlocks,
      tasks,
      toggleProjectNode,
      toggleTask,
      updateScheduleBlocks,
    ],
  );

  const value = useMemo<PlannerContextValue>(
    () => ({
      ready,
      thoughts,
      tasks,
      events,
      goals,
      projects,
      projectNodes,
      scheduleBlocks,
      fragmentActivities,
      notifications,
      originLinks,
      aiRuns,
      settings,
      conflicts,
      syncState,
      syncMessage,
      refresh,
      syncNow,
      addThought,
      updateThoughtStatus,
      restoreThought,
      addTask,
      addTasks,
      updateTask,
      deleteTask,
      toggleTask,
      addEvent,
      updateEvent,
      deleteEvent,
      convertThoughtToDraft,
      convertThoughtsToTasks,
      convertThoughtsToEvents,
      addGoal,
      updateGoal,
      deleteGoal,
      addProject,
      updateProject,
      deleteProject,
      duplicateProject,
      importProjectOutline,
      resumeProjectImport,
      addProjectNode,
      updateProjectNode,
      moveProjectNode,
      deleteProjectNode,
      toggleProjectNode,
      setProjectNodeFocus,
      addScheduleBlock,
      updateScheduleBlock,
      deleteScheduleBlock,
      completeScheduleBlock,
      addFragmentActivity,
      updateFragmentActivity,
      deleteFragmentActivity,
      markNotificationRead,
      saveSettings,
      removeItemType,
      saveAiRun,
      resolveConflict,
      resolveAllConflicts,
    }),
    [
      ready,
      thoughts,
      tasks,
      events,
      goals,
      projects,
      projectNodes,
      scheduleBlocks,
      fragmentActivities,
      notifications,
      originLinks,
      aiRuns,
      settings,
      conflicts,
      syncState,
      syncMessage,
      refresh,
      syncNow,
      addThought,
      updateThoughtStatus,
      restoreThought,
      addTask,
      addTasks,
      updateTask,
      deleteTask,
      toggleTask,
      addEvent,
      updateEvent,
      deleteEvent,
      convertThoughtToDraft,
      convertThoughtsToTasks,
      convertThoughtsToEvents,
      addGoal,
      updateGoal,
      deleteGoal,
      addProject,
      updateProject,
      deleteProject,
      duplicateProject,
      importProjectOutline,
      resumeProjectImport,
      addProjectNode,
      updateProjectNode,
      moveProjectNode,
      deleteProjectNode,
      toggleProjectNode,
      setProjectNodeFocus,
      addScheduleBlock,
      updateScheduleBlock,
      deleteScheduleBlock,
      completeScheduleBlock,
      addFragmentActivity,
      updateFragmentActivity,
      deleteFragmentActivity,
      markNotificationRead,
      saveSettings,
      removeItemType,
      saveAiRun,
      resolveConflict,
      resolveAllConflicts,
    ],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("usePlanner must be used inside PlannerProvider");
  return value;
}
