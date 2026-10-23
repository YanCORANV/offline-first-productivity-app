import { useCallback, type Dispatch, type SetStateAction } from "react";
import { isLeafNode } from "@/lib/planning";
import { getPlannerDb } from "@/lib/local-db";
import { newId, nowIso, type ScheduleBlock } from "@/lib/domain";
import type { NewScheduleBlockInput } from "./contracts";
import { active, operationFor, sortBlocks } from "./internals";

export function useScheduleBlockMutations({
  scheduleBlocks,
  setScheduleBlocks,
  kickSync,
}: {
  scheduleBlocks: ScheduleBlock[];
  setScheduleBlocks: Dispatch<SetStateAction<ScheduleBlock[]>>;
  kickSync: () => void;
}) {
  const addScheduleBlock = useCallback(
    async (input: NewScheduleBlockInput) => {
      const db = getPlannerDb();
      if (input.sourceType === "projectNode") {
        const node = await db.projectNodes.get(input.sourceId);
        if (!node) throw new Error("找不到项目节点");
        const nodes = (await db.projectNodes.where("projectId").equals(node.projectId).toArray()).filter(active);
        if (!isLeafNode(node.id, nodes)) throw new Error("只有叶子节点可以安排进 Calendar");
      }
      const time = nowIso();
      const block: ScheduleBlock = {
        id: newId("block"),
        entityType: "scheduleBlock",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        date: input.date,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        status: "planned",
        reminderRules: input.reminderRules ?? [],
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      setScheduleBlocks((items) => [...items, block].sort(sortBlocks));
      try {
        await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
          await db.scheduleBlocks.put(block);
          await db.operations.put(operationFor(block, 0));
        });
        kickSync();
        return block;
      } catch (error) {
        setScheduleBlocks((items) => items.filter((item) => item.id !== block.id));
        throw error;
      }
    },
    [kickSync, setScheduleBlocks],
  );

  const updateScheduleBlock = useCallback(
    async (id: string, patch: Partial<ScheduleBlock>) => {
      const db = getPlannerDb();
      const current = scheduleBlocks.find((block) => block.id === id) ?? await db.scheduleBlocks.get(id);
      if (!current) return;
      const nextPatch = { ...patch, updatedAt: nowIso(), version: current.version + 1 };
      setScheduleBlocks((items) => items.map((block) => block.id === id ? { ...block, ...nextPatch } : block).sort(sortBlocks));
      try {
        await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
          await db.scheduleBlocks.update(id, nextPatch);
          await db.operations.put(operationFor({ ...current, ...nextPatch }, current.version, "upsert", nextPatch));
        });
        kickSync();
      } catch (error) {
        setScheduleBlocks((items) => items.map((block) => block.id === id ? current : block).sort(sortBlocks));
        throw error;
      }
    },
    [kickSync, scheduleBlocks, setScheduleBlocks],
  );

  const updateScheduleBlocks = useCallback(
    async (patches: Array<{ id: string; patch: Partial<ScheduleBlock> }>) => {
      if (!patches.length) return;
      const db = getPlannerDb();
      const time = nowIso();
      const currentById = new Map(scheduleBlocks.map((block) => [block.id, block]));
      const updates = patches.flatMap(({ id, patch }) => {
        const current = currentById.get(id);
        if (!current) return [];
        const nextPatch = { ...patch, updatedAt: time, version: current.version + 1 };
        return [{ current, nextPatch, next: { ...current, ...nextPatch } }];
      });
      if (!updates.length) return;
      const nextById = new Map(updates.map(({ next }) => [next.id, next]));
      setScheduleBlocks((items) =>
        items.map((block) => nextById.get(block.id) ?? block).sort(sortBlocks),
      );
      try {
        await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
          await db.scheduleBlocks.bulkUpdate(
            updates.map(({ current, nextPatch }) => ({
              key: current.id,
              changes: nextPatch,
            })),
          );
          await db.operations.bulkPut(
            updates.map(({ current, nextPatch, next }) =>
              operationFor(next, current.version, "upsert", nextPatch),
            ),
          );
        });
        kickSync();
      } catch (error) {
        const previousById = new Map(updates.map(({ current }) => [current.id, current]));
        setScheduleBlocks((items) =>
          items.map((block) => previousById.get(block.id) ?? block).sort(sortBlocks),
        );
        throw error;
      }
    },
    [kickSync, scheduleBlocks, setScheduleBlocks],
  );

  const deleteScheduleBlock = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = scheduleBlocks.find((block) => block.id === id) ?? await db.scheduleBlocks.get(id);
      if (!current) return;
      const time = nowIso();
      const patch: Partial<ScheduleBlock> = {
        reminderRules: [],
        deletedAt: time,
        updatedAt: time,
        version: current.version + 1,
      };
      setScheduleBlocks((items) => items.filter((item) => item.id !== id));
      try {
        await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
          await db.scheduleBlocks.update(id, patch);
          await db.operations.put(operationFor({ ...current, ...patch }, current.version, "delete", patch));
        });
      } catch (error) {
        setScheduleBlocks((items) => [...items.filter((item) => item.id !== id), current].sort(sortBlocks));
        throw error;
      }
      kickSync();
    },
    [kickSync, scheduleBlocks, setScheduleBlocks],
  );

  return { addScheduleBlock, updateScheduleBlock, updateScheduleBlocks, deleteScheduleBlock };
}
