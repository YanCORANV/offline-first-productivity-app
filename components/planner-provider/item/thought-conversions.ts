import { useCallback, type Dispatch, type SetStateAction } from "react";
import { newId, nowIso, type OriginLink, type PlannerTask, type QuickThought } from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import type { PlannerContextValue } from "../contracts";
import { operationFor, sortUpdated } from "../internals";

export function useThoughtConversions({
  thoughts,
  tasks,
  setThoughts,
  setTasks,
  setOriginLinks,
  addEvent,
  updateThoughtStatus,
  kickSync,
}: {
  thoughts: QuickThought[];
  tasks: PlannerTask[];
  setThoughts: Dispatch<SetStateAction<QuickThought[]>>;
  setTasks: Dispatch<SetStateAction<PlannerTask[]>>;
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
  addEvent: PlannerContextValue["addEvent"];
  updateThoughtStatus: PlannerContextValue["updateThoughtStatus"];
  kickSync: () => void;
}) {
  const convertThoughtToDraft = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const thought = thoughts.find((item) => item.id === id) ?? await db.thoughts.get(id);
      if (!thought || thought.status !== "inbox") return null;
      const existing =
        tasks.find((task) => (task.originThoughtIds ?? []).includes(id)) ??
        await db.tasks
          .filter((task) => !task.deletedAt && (task.originThoughtIds ?? []).includes(id))
          .first();
      if (existing) return { ...existing, planningState: existing.planningState ?? "draft" };

      const time = nowIso();
      const task: PlannerTask = {
        id: newId("task"),
        entityType: "task",
        planningState: "draft",
        taskKind: "ordinary",
        title: thought.content.trim(),
        notes: "",
        itemTypeId: "temporary",
        colorOverride: null,
        status: "open",
        dueAt: null,
        scheduledStartAt: null,
        durationMinutes: null,
        isAllDay: false,
        needsContinuousTime: false,
        isFragmentFriendly: false,
        recurrenceRule: null,
        reminderOffsetMinutes: null,
        reminderRules: [],
        assignmentStatus: null,
        desiredCompletionAt: null,
        actualDeadlineAt: null,
        completedAt: null,
        completedOccurrenceKeys: [],
        originThoughtIds: [id],
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const link: OriginLink = {
        id: `origin_${id}_${task.id}`,
        entityType: "originLink",
        sourceEntityType: "thought",
        sourceEntityId: id,
        targetEntityType: "task",
        targetEntityId: task.id,
        relationship: "created_from",
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const thoughtPatch: Partial<QuickThought> = {
        status: "archived",
        processedAt: time,
        resultLabel: "已转为待落实事项",
        updatedAt: time,
        version: thought.version + 1,
      };
      const nextThought = { ...thought, ...thoughtPatch };
      setTasks((items) => [task, ...items].sort(sortUpdated));
      setThoughts((items) => items.filter((item) => item.id !== id));
      setOriginLinks((items) => [link, ...items].sort(sortUpdated));
      try {
        await db.transaction(
          "rw",
          [db.tasks, db.thoughts, db.originLinks, db.operations],
          async () => {
            await db.tasks.put(task);
            await db.originLinks.put(link);
            await db.thoughts.update(id, thoughtPatch);
            await db.operations.bulkPut([
              operationFor(task, 0),
              operationFor(link, 0),
              operationFor(nextThought, thought.version, "upsert", thoughtPatch),
            ]);
          },
        );
      } catch (error) {
        setTasks((items) => items.filter((item) => item.id !== task.id));
        setThoughts((items) => [thought, ...items].sort(sortUpdated));
        setOriginLinks((items) => items.filter((item) => item.id !== link.id));
        throw error;
      }
      kickSync();
      return task;
    },
    [kickSync, setOriginLinks, setTasks, setThoughts, tasks, thoughts],
  );

  const convertThoughtsToTasks = useCallback(
    async (ids: string[]) => {
      for (const id of ids) await convertThoughtToDraft(id);
    },
    [convertThoughtToDraft],
  );

  const convertThoughtsToEvents = useCallback(
    async (ids: string[]) => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      for (const id of ids) {
        const thought = thoughts.find((item) => item.id === id);
        if (!thought) continue;
        const end = new Date(start.getTime() + 30 * 60_000);
        await addEvent({
          title: thought.content,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          originThoughtIds: [id],
        });
      }
      await updateThoughtStatus(ids, "archived", `已加入 ${ids.length} 条日程`);
    },
    [addEvent, thoughts, updateThoughtStatus],
  );
  return { convertThoughtToDraft, convertThoughtsToTasks, convertThoughtsToEvents };
}
