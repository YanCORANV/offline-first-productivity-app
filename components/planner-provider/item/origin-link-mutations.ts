import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  newId,
  nowIso,
  type CalendarEvent,
  type OriginLink,
  type PlannerTask,
  type Project,
  type ProjectNode,
} from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { operationFor, sortUpdated } from "../internals";

export function originLinksFor(
  sourceThoughtIds: string[],
  target: PlannerTask | CalendarEvent | Project | ProjectNode,
  time = nowIso(),
): OriginLink[] {
  return [...new Set(sourceThoughtIds)].map((sourceEntityId) => ({
    id: newId("origin"),
    entityType: "originLink",
    sourceEntityType: "thought",
    sourceEntityId,
    targetEntityType: target.entityType,
    targetEntityId: target.id,
    relationship: "created_from",
    createdAt: time,
    updatedAt: time,
    version: 1,
  }));
}

export function useOriginLinkMutations({
  setOriginLinks,
}: {
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
}) {
  const addOriginLinks = useCallback(
    async (
      sourceThoughtIds: string[],
      target: PlannerTask | CalendarEvent | Project | ProjectNode,
    ) => {
      if (!sourceThoughtIds.length) return;
      const db = getPlannerDb();
      const links = originLinksFor(sourceThoughtIds, target);
      setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
      try {
        await db.transaction("rw", [db.originLinks, db.operations], async () => {
          await db.originLinks.bulkPut(links);
          await db.operations.bulkPut(links.map((link) => operationFor(link, 0)));
        });
      } catch (error) {
        setOriginLinks((current) =>
          current.filter((link) => !links.some((item) => item.id === link.id)),
        );
        throw error;
      }
    },
    [setOriginLinks],
  );
  return { addOriginLinks };
}
