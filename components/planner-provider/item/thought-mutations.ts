import { useCallback, type Dispatch, type SetStateAction } from "react";
import { newId, nowIso, type PlannerSettings, type QuickThought } from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { active, operationFor, sortUpdated } from "../internals";

export function useThoughtMutations({
  thoughts,
  settings,
  setThoughts,
  kickSync,
}: {
  thoughts: QuickThought[];
  settings: PlannerSettings;
  setThoughts: Dispatch<SetStateAction<QuickThought[]>>;
  kickSync: () => void;
}) {
  const addThought = useCallback(
    async (content: string) => {
      const time = nowIso();
      const thought: QuickThought = {
        id: newId("thought"),
        entityType: "thought",
        content: content.trim(),
        status: "inbox",
        capturedTimezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || settings.timezone,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const db = getPlannerDb();
      setThoughts((current) => [thought, ...current]);
      try {
        await db.transaction("rw", [db.thoughts, db.operations], async () => {
          await db.thoughts.put(thought);
          await db.operations.put(operationFor(thought, 0));
        });
        kickSync();
        return thought;
      } catch (error) {
        setThoughts((current) => current.filter((item) => item.id !== thought.id));
        throw error;
      }
    },
    [kickSync, setThoughts, settings.timezone],
  );

  const updateThoughtStatus = useCallback(
    async (ids: string[], status: QuickThought["status"], resultLabel?: string) => {
      const db = getPlannerDb();
      const time = nowIso();
      const idSet = new Set(ids);
      const currentItems = thoughts.filter((thought) => idSet.has(thought.id));
      if (!currentItems.length) return;
      const updates = currentItems.map((current) => {
        const patch: Partial<QuickThought> = {
          status,
          updatedAt: time,
          processedAt: status === "inbox" ? null : time,
          resultLabel: resultLabel ?? current.resultLabel,
          deletedAt: status === "deleted" ? time : null,
          version: current.version + 1,
        };
        return { current, patch, next: { ...current, ...patch } };
      });
      setThoughts((current) =>
        current
          .map((thought) => updates.find((item) => item.current.id === thought.id)?.next ?? thought)
          .filter(active)
          .sort(sortUpdated),
      );
      try {
        await db.transaction("rw", [db.thoughts, db.operations], async () => {
          await db.thoughts.bulkPut(updates.map((item) => item.next));
          await db.operations.bulkPut(
            updates.map(({ current, next, patch }) =>
              operationFor(
                next,
                current.version,
                status === "deleted" ? "delete" : "upsert",
                patch,
              ),
            ),
          );
        });
      } catch (error) {
        setThoughts((current) => {
          const previous = new Map(currentItems.map((item) => [item.id, item]));
          return current
            .filter((item) => !previous.has(item.id))
            .concat(currentItems)
            .filter(active)
            .sort(sortUpdated);
        });
        throw error;
      }
      kickSync();
    },
    [kickSync, setThoughts, thoughts],
  );

  const restoreThought = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = await db.thoughts.get(id);
      if (!current || current.status !== "deleted") return;
      const time = nowIso();
      const patch: Partial<QuickThought> = {
        status: "inbox",
        processedAt: null,
        deletedAt: null,
        updatedAt: time,
        version: current.version + 1,
      };
      const next = { ...current, ...patch };
      setThoughts((items) => [...items, next].filter(active).sort(sortUpdated));
      try {
        await db.transaction("rw", [db.thoughts, db.operations], async () => {
          await db.thoughts.update(id, patch);
          await db.operations.put(operationFor(next, current.version, "upsert", patch));
        });
      } catch (error) {
        setThoughts((items) => items.filter((item) => item.id !== id));
        throw error;
      }
      kickSync();
    },
    [kickSync, setThoughts],
  );
  return { addThought, updateThoughtStatus, restoreThought };
}
