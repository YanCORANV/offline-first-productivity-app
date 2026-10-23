import { useCallback, type Dispatch, type SetStateAction } from "react";
import { localDateKey, newId, nowIso, type OriginLink, type PlannerTask, type ScheduleBlock } from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import type { NewTaskInput } from "../contracts";
import { legacyReminder, operationFor, sortBlocks, sortUpdated } from "../internals";
import { originLinksFor } from "./origin-link-mutations";

function taskFromInput(input: NewTaskInput, time: string): PlannerTask {
  const defaultDate = new Date();
  defaultDate.setHours(23, 59, 0, 0);
  const planningState = input.planningState ?? "planned";
  return {
    id: newId("task"),
    entityType: "task",
    planningState,
    taskKind: input.taskKind ?? "ordinary",
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    itemTypeId: input.itemTypeId ?? "research",
    colorOverride: input.colorOverride ?? null,
    status:
      input.status ??
      (input.taskKind === "assignment" && input.assignmentStatus === "submitted"
        ? "completed"
        : "open"),
    dueAt:
      planningState === "draft"
        ? input.dueAt ?? null
        : input.dueAt ?? input.desiredCompletionAt ?? defaultDate.toISOString(),
    scheduledStartAt: input.scheduledStartAt ?? null,
    durationMinutes: input.durationMinutes ?? null,
    isAllDay: Boolean(input.isAllDay),
    needsContinuousTime: Boolean(input.needsContinuousTime),
    isFragmentFriendly:
      !input.needsContinuousTime && Boolean(input.isFragmentFriendly),
    recurrenceRule: input.recurrenceRule ?? null,
    reminderOffsetMinutes: input.reminderOffsetMinutes ?? null,
    reminderRules: input.reminderRules ?? legacyReminder(input.reminderOffsetMinutes),
    assignmentStatus: input.taskKind === "assignment" ? input.assignmentStatus ?? "todo" : null,
    desiredCompletionAt: input.desiredCompletionAt ?? null,
    actualDeadlineAt: input.actualDeadlineAt ?? null,
    courseEventId: input.courseEventId ?? null,
    courseOccurrenceDate: input.courseOccurrenceDate ?? null,
    completedAt:
      input.status === "completed" ||
      (input.taskKind === "assignment" && input.assignmentStatus === "submitted")
        ? time
        : null,
    completedOccurrenceKeys: [],
    originThoughtIds: input.originThoughtIds ?? [],
    createdAt: time,
    updatedAt: time,
    version: 1,
  };
}

export function useTaskMutations({
  tasks,
  setTasks,
  setScheduleBlocks,
  setOriginLinks,
  kickSync,
}: {
  tasks: PlannerTask[];
  setTasks: Dispatch<SetStateAction<PlannerTask[]>>;
  setScheduleBlocks: Dispatch<SetStateAction<ScheduleBlock[]>>;
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
  kickSync: () => void;
}) {
  const addTasks = useCallback(
    async (inputs: NewTaskInput[]) => {
      if (!inputs.length) return [];
      if (inputs.some((input) => !input.title.trim())) {
        throw new Error("事项内容不能为空");
      }
      const time = nowIso();
      const created = inputs.map((input) => taskFromInput(input, time));
      const links = created.flatMap((task) => originLinksFor(task.originThoughtIds, task, time));
      const createdIds = new Set(created.map((task) => task.id));
      const db = getPlannerDb();
      setTasks((current) => [...created, ...current].sort(sortUpdated));
      try {
        await db.transaction("rw", [db.tasks, db.originLinks, db.operations], async () => {
          await db.tasks.bulkPut(created);
          if (links.length) await db.originLinks.bulkPut(links);
          await db.operations.bulkPut([
            ...created.map((task) => operationFor(task, 0)),
            ...links.map((link) => operationFor(link, 0)),
          ]);
        });
      } catch (error) {
        setTasks((current) => current.filter((item) => !createdIds.has(item.id)));
        throw error;
      }
      if (links.length) setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
      kickSync();
      return created;
    },
    [kickSync, setOriginLinks, setTasks],
  );

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const [task] = await addTasks([input]);
      return task;
    },
    [addTasks],
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<PlannerTask>) => {
      const db = getPlannerDb();
      const current = tasks.find((task) => task.id === id) ?? await db.tasks.get(id);
      if (!current) return;
      const planningState =
        patch.planningState ??
        (patch.dueAt !== undefined
          ? patch.dueAt
            ? "planned"
            : "draft"
          : current.planningState ?? "planned");
      const continuous =
        patch.needsContinuousTime ?? current.needsContinuousTime;
      const fragmentFriendly =
        patch.isFragmentFriendly ?? current.isFragmentFriendly;
      const nextPatch = {
        ...patch,
        planningState,
        needsContinuousTime: Boolean(continuous),
        isFragmentFriendly: Boolean(fragmentFriendly) && !continuous,
        updatedAt: nowIso(),
        version: current.version + 1,
      };
      const next = { ...current, ...nextPatch };
      setTasks((items) =>
        items.map((item) => (item.id === id ? next : item)).sort(sortUpdated),
      );
      try {
        await db.transaction("rw", [db.tasks, db.operations], async () => {
          await db.tasks.update(id, nextPatch);
          await db.operations.put(
            operationFor(next, current.version, "upsert", nextPatch),
          );
        });
      } catch (error) {
        setTasks((items) =>
          items.map((item) => (item.id === id ? current : item)).sort(sortUpdated),
        );
        throw error;
      }
      kickSync();
    },
    [kickSync, setTasks, tasks],
  );

  const toggleTask = useCallback(
    async (id: string, occurrenceAt?: string) => {
      const current = await getPlannerDb().tasks.get(id);
      if (!current) return;
      if (current.recurrenceRule) {
        const occurrenceKey = localDateKey(new Date(occurrenceAt ?? nowIso()));
        const completedKeys = current.completedOccurrenceKeys ?? [];
        const alreadyCompleted = completedKeys.includes(occurrenceKey);
        await updateTask(id, {
          status: "open",
          completedAt: alreadyCompleted ? null : nowIso(),
          completedOccurrenceKeys: alreadyCompleted
            ? completedKeys.filter((key) => key !== occurrenceKey)
            : [...completedKeys, occurrenceKey],
        });
        return;
      }
      if (current.status === "failed") {
        await updateTask(id, {
          status: "open",
          completedAt: null,
        });
        return;
      }
      const completed = current.status !== "completed";
      await updateTask(id, {
        status: completed ? "completed" : "open",
        completedAt: completed ? nowIso() : null,
        assignmentStatus:
          current.taskKind === "assignment"
            ? completed ? "submitted" : current.assignmentStatus === "submitted" ? "todo" : current.assignmentStatus
            : current.assignmentStatus,
      });
    },
    [updateTask],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = tasks.find((task) => task.id === id) ?? await db.tasks.get(id);
      if (!current) return;
      const time = nowIso();
      const patch: Partial<PlannerTask> = {
        title: "",
        notes: "",
        status: "deleted",
        deletedAt: time,
        reminderRules: [],
        updatedAt: time,
        version: current.version + 1,
      };
      setTasks((items) => items.filter((item) => item.id !== id));
      const futureBlocks = (
        await db.scheduleBlocks.where("sourceId").equals(id).toArray()
      ).filter(
        (block) => block.status === "planned" && block.date >= localDateKey(new Date()),
      );
      const blockUpdates = futureBlocks.map((block) => {
        const blockPatch: Partial<ScheduleBlock> = {
          status: "skipped",
          reminderRules: [],
          updatedAt: time,
          version: block.version + 1,
        };
        return { current: block, patch: blockPatch, next: { ...block, ...blockPatch } };
      });
      setScheduleBlocks((items) =>
        items
          .map((item) => blockUpdates.find((entry) => entry.current.id === item.id)?.next ?? item)
          .sort(sortBlocks),
      );
      try {
        await db.transaction(
          "rw",
          [db.tasks, db.scheduleBlocks, db.operations],
          async () => {
            await db.tasks.update(id, patch);
            if (blockUpdates.length) {
              await db.scheduleBlocks.bulkUpdate(
                blockUpdates.map(({ current: block, patch: blockPatch }) => ({
                  key: block.id,
                  changes: blockPatch,
                })),
              );
            }
            await db.operations.bulkPut([
              operationFor(
                { ...current, ...patch },
                current.version,
                "delete",
                patch,
              ),
              ...blockUpdates.map(({ current: block, patch: blockPatch, next }) =>
                operationFor(next, block.version, "upsert", blockPatch),
              ),
            ]);
          },
        );
      } catch (error) {
        setTasks((items) => [...items, current].sort(sortUpdated));
        setScheduleBlocks((items) =>
          items
            .map(
              (item) =>
                blockUpdates.find((entry) => entry.current.id === item.id)?.current ??
                item,
            )
            .sort(sortBlocks),
        );
        throw error;
      }
      kickSync();
    },
    [kickSync, setScheduleBlocks, setTasks, tasks],
  );
  return { addTask, addTasks, updateTask, toggleTask, deleteTask };
}
