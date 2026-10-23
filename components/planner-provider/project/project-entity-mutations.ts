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
import { active, operationFor, sortBlocks, sortUpdated } from "../internals";

export function useProjectEntityMutations({
  projects,
  projectNodes,
  scheduleBlocks,
  originLinks,
  setProjects,
  setProjectNodes,
  setScheduleBlocks,
  setOriginLinks,
  addOriginLinks,
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
  addOriginLinks: (sourceThoughtIds: string[], target: Project) => Promise<void>;
  kickSync: () => void;
}) {
  const addProject = useCallback(
    async (goalId: string, title: string, sourceThoughtIds: string[] = []) => {
      const time = nowIso();
      const db = getPlannerDb();
      const project: Project = {
        id: newId("project"),
        entityType: "project",
        goalId,
        title: title.trim(),
        status: "active",
        initializationState: "ready",
        order: projects.filter((item) => item.goalId === goalId).length,
        sourceThoughtIds,
        plannedStartDate: null,
        plannedEndDate: null,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      setProjects((current) => [...current, project].sort((a, b) => a.order - b.order));
      try {
        await db.transaction("rw", [db.projects, db.operations], async () => {
          await db.projects.put(project);
          await db.operations.put(operationFor(project, 0));
        });
        await addOriginLinks(sourceThoughtIds, project);
        kickSync();
        return project;
      } catch (error) {
        setProjects((current) => current.filter((item) => item.id !== project.id));
        throw error;
      }
    },
    [addOriginLinks, kickSync, projects, setProjects],
  );

  const updateProject = useCallback(
    async (id: string, patch: Partial<Project>) => {
      const db = getPlannerDb();
      const current =
        projects.find((project) => project.id === id) ?? await db.projects.get(id);
      if (!current) return;
      const nextPatch = { ...patch, updatedAt: nowIso(), version: current.version + 1 };
      setProjects((items) =>
        items
          .map((project) => project.id === id ? { ...project, ...nextPatch } : project)
          .sort((a, b) => a.order - b.order),
      );
      try {
        await db.transaction("rw", [db.projects, db.operations], async () => {
          await db.projects.update(id, nextPatch);
          await db.operations.put(
            operationFor({ ...current, ...nextPatch }, current.version, "upsert", nextPatch),
          );
        });
        kickSync();
      } catch (error) {
        setProjects((items) =>
          items
            .map((project) => project.id === id ? current : project)
            .sort((a, b) => a.order - b.order),
        );
        throw error;
      }
    },
    [kickSync, projects, setProjects],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const project = projects.find((item) => item.id === id);
      if (!project) return;
      const relatedNodes = projectNodes.filter((node) => node.projectId === id);
      const nodeIds = new Set(relatedNodes.map((node) => node.id));
      const relatedBlocks = scheduleBlocks.filter(
        (block) =>
          active(block) &&
          block.sourceType === "projectNode" &&
          nodeIds.has(block.sourceId),
      );
      const relatedLinks = originLinks.filter(
        (link) =>
          active(link) &&
          ((link.targetEntityType === "project" && link.targetEntityId === id) ||
            (link.targetEntityType === "projectNode" &&
              nodeIds.has(link.targetEntityId))),
      );
      const time = nowIso();
      const projectPatch: Partial<Project> = {
        title: "",
        deletedAt: time,
        updatedAt: time,
        version: project.version + 1,
      };
      const nodeUpdates = relatedNodes.map((node) => ({
        current: node,
        patch: {
          title: "",
          deletedAt: time,
          updatedAt: time,
          version: node.version + 1,
        } satisfies Partial<ProjectNode>,
      }));
      const blockUpdates = relatedBlocks.map((block) => ({
        current: block,
        patch: {
          reminderRules: [],
          deletedAt: time,
          updatedAt: time,
          version: block.version + 1,
        } satisfies Partial<ScheduleBlock>,
      }));
      const linkUpdates = relatedLinks.map((link) => ({
        current: link,
        patch: {
          deletedAt: time,
          updatedAt: time,
          version: link.version + 1,
        } satisfies Partial<OriginLink>,
      }));

      setProjects((current) => current.filter((item) => item.id !== id));
      setProjectNodes((current) => current.filter((node) => node.projectId !== id));
      setScheduleBlocks((current) =>
        current.filter(
          (block) =>
            block.sourceType !== "projectNode" || !nodeIds.has(block.sourceId),
        ),
      );
      setOriginLinks((current) =>
        current.filter(
          (link) =>
            !(
              (link.targetEntityType === "project" && link.targetEntityId === id) ||
              (link.targetEntityType === "projectNode" &&
                nodeIds.has(link.targetEntityId))
            ),
        ),
      );

      try {
        await db.transaction(
          "rw",
          [db.projects, db.projectNodes, db.scheduleBlocks, db.originLinks, db.operations],
          async () => {
            await db.projects.update(id, projectPatch);
            if (nodeUpdates.length) {
              await db.projectNodes.bulkUpdate(
                nodeUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            if (blockUpdates.length) {
              await db.scheduleBlocks.bulkUpdate(
                blockUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            if (linkUpdates.length) {
              await db.originLinks.bulkUpdate(
                linkUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            await db.operations.bulkPut([
              operationFor(
                { ...project, ...projectPatch },
                project.version,
                "delete",
                projectPatch,
              ),
              ...nodeUpdates.map(({ current, patch }) =>
                operationFor(
                  { ...current, ...patch },
                  current.version,
                  "delete",
                  patch,
                ),
              ),
              ...blockUpdates.map(({ current, patch }) =>
                operationFor(
                  { ...current, ...patch },
                  current.version,
                  "delete",
                  patch,
                ),
              ),
              ...linkUpdates.map(({ current, patch }) =>
                operationFor(
                  { ...current, ...patch },
                  current.version,
                  "delete",
                  patch,
                ),
              ),
            ]);
          },
        );
      } catch (error) {
        setProjects((current) =>
          [...current.filter((item) => item.id !== project.id), project].sort(
            (a, b) => a.order - b.order,
          ),
        );
        setProjectNodes((current) =>
          [...current.filter((node) => !nodeIds.has(node.id)), ...relatedNodes].sort(
            (a, b) => a.order - b.order,
          ),
        );
        setScheduleBlocks((current) =>
          [...current.filter((block) => !blockUpdates.some((item) => item.current.id === block.id)), ...relatedBlocks]
            .sort(sortBlocks),
        );
        setOriginLinks((current) =>
          [...current.filter((link) => !linkUpdates.some((item) => item.current.id === link.id)), ...relatedLinks]
            .sort(sortUpdated),
        );
        throw error;
      }
      kickSync();
    },
    [
      kickSync,
      originLinks,
      projectNodes,
      projects,
      scheduleBlocks,
      setOriginLinks,
      setProjectNodes,
      setProjects,
      setScheduleBlocks,
    ],
  );

  return { addProject, updateProject, deleteProject };
}
