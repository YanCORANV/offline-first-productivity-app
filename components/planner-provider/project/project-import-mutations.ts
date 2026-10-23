import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  newId,
  nowIso,
  type OriginLink,
  type Project,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import type { OutlineCandidate } from "@/lib/planning";
import { operationFor, sortBlocks, sortUpdated } from "../internals";

export function useProjectImportMutations({
  projects,
  projectNodes,
  scheduleBlocks,
  originLinks,
  setProjects,
  setProjectNodes,
  setScheduleBlocks,
  setOriginLinks,
  kickSync,
}: {
  projects: Project[];
  projectNodes: ProjectNode[];
  scheduleBlocks: ScheduleBlock[];
  originLinks: OriginLink[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setProjectNodes: Dispatch<SetStateAction<ProjectNode[]>>;
  setScheduleBlocks: Dispatch<SetStateAction<ScheduleBlock[]>>;
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
  kickSync: () => void;
}) {
  const duplicateProject = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const source = projects.find((project) => project.id === id) ?? await db.projects.get(id);
      if (!source) return null;
      const sourceNodes = projectNodes.filter((node) => node.projectId === id);
      const time = nowIso();
      const copy: Project = {
        id: newId("project"),
        entityType: "project",
        goalId: source.goalId,
        title: `${source.title}（副本）`,
        status: "active",
        initializationState: source.initializationState,
        order: projects.filter((project) => project.goalId === source.goalId).length,
        sourceThoughtIds: [],
        plannedStartDate: null,
        plannedEndDate: null,
        importCheckpoint: null,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const idMap = new Map(sourceNodes.map((node) => [node.id, newId("node")]));
      const copies: ProjectNode[] = sourceNodes.map((node) => ({
        id: idMap.get(node.id)!,
        entityType: "projectNode",
        projectId: copy.id,
        parentId: node.parentId ? idMap.get(node.parentId) ?? null : null,
        title: node.title,
        order: node.order,
        status: "open",
        isFocused: false,
        needsContinuousTime: Boolean(node.needsContinuousTime),
        isFragmentFriendly: Boolean(node.isFragmentFriendly),
        sourceThoughtIds: [],
        importIndex: null,
        completedAt: null,
        createdAt: time,
        updatedAt: time,
        version: 1,
      }));

      setProjects((current) => [...current, copy].sort((a, b) => a.order - b.order));
      setProjectNodes((current) => [...current, ...copies].sort((a, b) => a.order - b.order));
      try {
        await db.transaction("rw", [db.projects, db.projectNodes, db.operations], async () => {
          await db.projects.put(copy);
          if (copies.length) await db.projectNodes.bulkPut(copies);
          await db.operations.bulkPut([
            operationFor(copy, 0),
            ...copies.map((node) => operationFor(node, 0)),
          ]);
        });
      } catch (error) {
        setProjects((current) => current.filter((project) => project.id !== copy.id));
        setProjectNodes((current) => current.filter((node) => node.projectId !== copy.id));
        throw error;
      }
      kickSync();
      return copy;
    },
    [kickSync, projectNodes, projects, setProjectNodes, setProjects],
  );

  const resumeProjectImport = useCallback(
    async (projectId: string) => {
      const db = getPlannerDb();
      const project = await db.projects.get(projectId);
      if (!project?.importCheckpoint) return;
      await db.projects.update(projectId, {
        importCheckpoint: null,
        updatedAt: nowIso(),
        version: project.version + 1,
      });
    },
    [],
  );

  const importProjectOutline = useCallback(
    async (
      goalId: string,
      title: string,
      candidates: OutlineCandidate[],
      sourceThoughtIds: string[] = [],
      targetProjectId?: string,
    ) => {
      const db = getPlannerDb();
      const time = nowIso();
      let project: Project;
      let baseVersion = 0;
      let previousProject: Project | null = null;
      let previousNodes: ProjectNode[] = [];
      let previousBlocks: ScheduleBlock[] = [];
      let previousProjectLinks: OriginLink[] = [];
      let previousNodeLinks: OriginLink[] = [];
      if (targetProjectId) {
        const existing = projects.find((item) => item.id === targetProjectId);
        if (!existing || existing.goalId !== goalId) {
          throw new Error("只能把 Markdown 导入当前 Goal 下的 Project");
        }
        previousProject = existing;
        baseVersion = existing.version;
        previousNodes = projectNodes.filter((node) => node.projectId === targetProjectId);
        previousProjectLinks = originLinks.filter(
          (link) => link.targetEntityType === "project" && link.targetEntityId === targetProjectId,
        );
        const previousNodeIds = new Set(previousNodes.map((node) => node.id));
        previousBlocks = scheduleBlocks.filter(
          (block) => block.sourceType === "projectNode" && previousNodeIds.has(block.sourceId),
        );
        previousNodeLinks = originLinks.filter(
          (link) => link.targetEntityType === "projectNode" && previousNodeIds.has(link.targetEntityId),
        );
        project = {
          ...existing,
          title: title.trim(),
          initializationState: "ready",
          sourceThoughtIds: Array.from(
            new Set([...(existing.sourceThoughtIds ?? []), ...sourceThoughtIds]),
          ),
          importCheckpoint: null,
          updatedAt: time,
          version: existing.version + 1,
        };
      } else {
        project = {
          id: newId("project"),
          entityType: "project",
          goalId,
          title: title.trim(),
          status: "active",
          initializationState: "ready",
          order: projects.filter((item) => item.goalId === goalId).length,
          sourceThoughtIds,
          importCheckpoint: null,
          createdAt: time,
          updatedAt: time,
          version: 1,
        };
      }
      const ids = candidates.map(() => newId("node"));
      const siblingOrders = new Map<string, number>();
      const nodes: ProjectNode[] = candidates.map((candidate, index) => {
        const parentId =
          candidate.parentIndex == null ? null : ids[candidate.parentIndex] ?? null;
        const orderKey = parentId ?? "root";
        const order = siblingOrders.get(orderKey) ?? 0;
        siblingOrders.set(orderKey, order + 1);
        return {
          id: ids[index],
          entityType: "projectNode",
          projectId: project.id,
          parentId,
          title: candidate.title.trim(),
          order,
          status: "open",
          isFocused: false,
          needsContinuousTime: false,
          isFragmentFriendly: false,
          sourceThoughtIds,
          importIndex: index,
          completedAt: null,
          createdAt: time,
          updatedAt: time,
          version: 1,
        };
      });
      const linkedThoughtIds = new Set(previousProjectLinks
        .filter((link) => link.sourceEntityType === "thought")
        .map((link) => link.sourceEntityId));
      const links: OriginLink[] = [...new Set(project.sourceThoughtIds)]
        .filter((sourceEntityId) => !linkedThoughtIds.has(sourceEntityId))
        .map((sourceEntityId) => ({
          id: `origin_${sourceEntityId}_${project.id}`,
          entityType: "originLink" as const,
          sourceEntityType: "thought" as const,
          sourceEntityId,
          targetEntityType: "project" as const,
          targetEntityId: project.id,
          relationship: "created_from" as const,
          createdAt: time,
          updatedAt: time,
          version: 1,
        }));
      const previousLinks = originLinks.filter((link) =>
        links.some((item) => item.id === link.id),
      );
      const previousLinksToReplace = previousNodeLinks;
      const previousLinkIds = new Set(previousLinksToReplace.map((link) => link.id));
      const nodeIdsToReplace = new Set(previousNodes.map((node) => node.id));
      const nodeDeleteUpdates = previousNodes.map((node) => ({
        current: node,
        patch: {
          title: "",
          deletedAt: time,
          updatedAt: time,
          version: node.version + 1,
        } satisfies Partial<ProjectNode>,
      }));
      const blockDeleteUpdates = previousBlocks.map((block) => ({
        current: block,
        patch: {
          reminderRules: [],
          deletedAt: time,
          updatedAt: time,
          version: block.version + 1,
        } satisfies Partial<ScheduleBlock>,
      }));
      const linkDeleteUpdates = previousNodeLinks.map((link) => ({
        current: link,
        patch: {
          deletedAt: time,
          updatedAt: time,
          version: link.version + 1,
        } satisfies Partial<OriginLink>,
      }));

      setProjects((current) =>
        [...current.filter((item) => item.id !== project.id), project].sort(
          (a, b) => a.order - b.order,
        ),
      );
      setProjectNodes((current) =>
        [...current.filter((node) => !nodeIdsToReplace.has(node.id)), ...nodes].sort(
          (a, b) => a.order - b.order,
        ),
      );
      if (previousBlocks.length) {
        setScheduleBlocks((current) =>
          current.filter((block) => !previousBlocks.some((item) => item.id === block.id)),
        );
      }
      if (links.length) {
        setOriginLinks((current) =>
          [
            ...current.filter(
              (link) =>
                !links.some((item) => item.id === link.id) &&
                !previousLinkIds.has(link.id),
            ),
            ...links,
          ].sort(sortUpdated),
        );
      } else if (previousLinksToReplace.length) {
        setOriginLinks((current) =>
          current.filter((link) => !previousLinkIds.has(link.id)),
        );
      }

      try {
        await db.transaction(
          "rw",
          [db.projects, db.projectNodes, db.scheduleBlocks, db.originLinks, db.operations],
          async () => {
            await db.projects.put(project);
            if (nodeDeleteUpdates.length) {
              await db.projectNodes.bulkUpdate(
                nodeDeleteUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            await db.projectNodes.bulkPut(nodes);
            if (blockDeleteUpdates.length) {
              await db.scheduleBlocks.bulkUpdate(
                blockDeleteUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            if (linkDeleteUpdates.length) {
              await db.originLinks.bulkUpdate(
                linkDeleteUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            if (links.length) await db.originLinks.bulkPut(links);
            await db.operations.bulkPut([
              operationFor(project, baseVersion),
              ...nodeDeleteUpdates.map(({ current, patch }) =>
                operationFor({ ...current, ...patch }, current.version, "delete", patch),
              ),
              ...blockDeleteUpdates.map(({ current, patch }) =>
                operationFor({ ...current, ...patch }, current.version, "delete", patch),
              ),
              ...linkDeleteUpdates.map(({ current, patch }) =>
                operationFor({ ...current, ...patch }, current.version, "delete", patch),
              ),
              ...nodes.map((node) => operationFor(node, 0)),
              ...links.map((link) => operationFor(link, 0)),
            ]);
          },
        );
      } catch (error) {
        setProjects((current) => {
          const withoutNext = current.filter((item) => item.id !== project.id);
          return previousProject
            ? [...withoutNext, previousProject].sort((a, b) => a.order - b.order)
            : withoutNext;
        });
        setProjectNodes((current) => [
          ...current.filter((node) => !nodes.some((item) => item.id === node.id)),
          ...previousNodes,
        ].sort((a, b) => a.order - b.order));
        if (previousBlocks.length) {
          setScheduleBlocks((current) =>
            [...current.filter((block) => !previousBlocks.some((item) => item.id === block.id)), ...previousBlocks]
              .sort(sortBlocks),
          );
        }
        if (links.length) {
          setOriginLinks((current) =>
            [
              ...current.filter(
                (link) =>
                  !links.some((item) => item.id === link.id) &&
                  !previousLinkIds.has(link.id),
              ),
              ...previousLinks,
              ...previousNodeLinks,
            ].sort(sortUpdated),
          );
        } else if (previousLinksToReplace.length) {
          setOriginLinks((current) => [
            ...current.filter((link) => !previousLinkIds.has(link.id)),
            ...previousNodeLinks,
          ].sort(sortUpdated));
        }
        throw error;
      }
      kickSync();
      return project;
    },
    [
      kickSync,
      originLinks,
      projectNodes,
      projects,
      scheduleBlocks,
      setOriginLinks,
      setProjectNodes,
      setScheduleBlocks,
      setProjects,
    ],
  );

  return { duplicateProject, resumeProjectImport, importProjectOutline };
}
