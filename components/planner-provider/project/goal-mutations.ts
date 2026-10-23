import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  MORANDI_COLORS,
  newId,
  nowIso,
  type Goal,
  type OriginLink,
  type Project,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { operationFor, sortBlocks, sortUpdated } from "../internals";

export function useGoalMutations({
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
  kickSync,
}: {
  goals: Goal[];
  projects: Project[];
  projectNodes: ProjectNode[];
  scheduleBlocks: ScheduleBlock[];
  originLinks: OriginLink[];
  setGoals: Dispatch<SetStateAction<Goal[]>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setProjectNodes: Dispatch<SetStateAction<ProjectNode[]>>;
  setScheduleBlocks: Dispatch<SetStateAction<ScheduleBlock[]>>;
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
  kickSync: () => void;
}) {
  const addGoal = useCallback(
    async (name: string, color?: string) => {
      const time = nowIso();
      const db = getPlannerDb();
      const goal: Goal = {
        id: newId("goal"),
        entityType: "goal",
        name: name.trim(),
        color: color ?? MORANDI_COLORS[goals.length % MORANDI_COLORS.length],
        order: goals.length,
        archived: false,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      setGoals((current) => [...current, goal].sort((a, b) => a.order - b.order));
      try {
        await db.transaction("rw", [db.goals, db.operations], async () => {
          await db.goals.put(goal);
          await db.operations.put(operationFor(goal, 0));
        });
        kickSync();
        return goal;
      } catch (error) {
        setGoals((current) => current.filter((item) => item.id !== goal.id));
        throw error;
      }
    },
    [goals.length, kickSync, setGoals],
  );

  const updateGoal = useCallback(
    async (id: string, patch: Partial<Goal>) => {
      const db = getPlannerDb();
      const current = goals.find((goal) => goal.id === id) ?? await db.goals.get(id);
      if (!current) return;
      const nextPatch = { ...patch, updatedAt: nowIso(), version: current.version + 1 };
      setGoals((items) =>
        items
          .map((goal) => goal.id === id ? { ...goal, ...nextPatch } : goal)
          .sort((a, b) => a.order - b.order),
      );
      try {
        await db.transaction("rw", [db.goals, db.operations], async () => {
          await db.goals.update(id, nextPatch);
          await db.operations.put(
            operationFor({ ...current, ...nextPatch }, current.version, "upsert", nextPatch),
          );
        });
        kickSync();
      } catch (error) {
        setGoals((items) =>
          items
            .map((goal) => goal.id === id ? current : goal)
            .sort((a, b) => a.order - b.order),
        );
        throw error;
      }
    },
    [goals, kickSync, setGoals],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const goal = goals.find((item) => item.id === id);
      if (!goal) return;
      const relatedProjects = projects.filter(
        (project) => project.goalId === id,
      );
      const projectIds = new Set(relatedProjects.map((project) => project.id));
      const relatedNodes = projectNodes.filter((node) =>
        projectIds.has(node.projectId),
      );
      const nodeIds = new Set(relatedNodes.map((node) => node.id));
      const relatedBlocks = scheduleBlocks.filter(
        (block) =>
          block.sourceType === "projectNode" && nodeIds.has(block.sourceId),
      );
      const relatedLinks = originLinks.filter(
        (link) =>
          ((link.targetEntityType === "goal" && link.targetEntityId === id) ||
            (link.targetEntityType === "project" && projectIds.has(link.targetEntityId)) ||
            (link.targetEntityType === "projectNode" && nodeIds.has(link.targetEntityId))),
      );
      const linkIds = new Set(relatedLinks.map((link) => link.id));
      const time = nowIso();
      const goalPatch: Partial<Goal> = {
        name: "",
        deletedAt: time,
        updatedAt: time,
        version: goal.version + 1,
      };
      const projectUpdates = relatedProjects.map((project) => ({
        current: project,
        patch: {
          title: "",
          deletedAt: time,
          updatedAt: time,
          version: project.version + 1,
        } satisfies Partial<Project>,
      }));
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
      const operations = [
        operationFor(
          { ...goal, ...goalPatch },
          goal.version,
          "delete",
          goalPatch,
        ),
        ...projectUpdates.map(({ current, patch }) =>
          operationFor(
            { ...current, ...patch },
            current.version,
            "delete",
            patch,
          ),
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
      ];

      setGoals((current) => current.filter((item) => item.id !== id));
      setProjects((current) =>
        current.filter((project) => !projectIds.has(project.id)),
      );
      setProjectNodes((current) =>
        current.filter((node) => !nodeIds.has(node.id)),
      );
      setScheduleBlocks((current) =>
        current.filter(
          (block) =>
            block.sourceType !== "projectNode" || !nodeIds.has(block.sourceId),
        ),
      );
      setOriginLinks((current) =>
        current.filter((link) => !linkIds.has(link.id)),
      );

      try {
        await db.transaction(
          "rw",
          [db.goals, db.projects, db.projectNodes, db.scheduleBlocks, db.originLinks, db.operations],
          async () => {
            await db.goals.update(goal.id, goalPatch);
            if (projectUpdates.length) {
              await db.projects.bulkUpdate(
                projectUpdates.map(({ current, patch }) => ({
                  key: current.id,
                  changes: patch,
                })),
              );
            }
            if (nodeUpdates.length) {
              await db.projectNodes.bulkUpdate(
                nodeUpdates.map(({ current, patch }) => ({
                  key: current.id,
                  changes: patch,
                })),
              );
            }
            if (blockUpdates.length) {
              await db.scheduleBlocks.bulkUpdate(
                blockUpdates.map(({ current, patch }) => ({
                  key: current.id,
                  changes: patch,
                })),
              );
            }
            if (linkUpdates.length) {
              await db.originLinks.bulkUpdate(
                linkUpdates.map(({ current, patch }) => ({
                  key: current.id,
                  changes: patch,
                })),
              );
            }
            await db.operations.bulkPut(operations);
          },
        );
      } catch (error) {
        setGoals((current) =>
          [...current.filter((item) => item.id !== goal.id), goal].sort(
            (a, b) => a.order - b.order,
          ),
        );
        setProjects((current) =>
          [
            ...current.filter((project) => !projectIds.has(project.id)),
            ...relatedProjects,
          ].sort((a, b) => a.order - b.order),
        );
        setProjectNodes((current) =>
          [...current.filter((node) => !nodeIds.has(node.id)), ...relatedNodes].sort(
            (a, b) => a.order - b.order,
          ),
        );
        setScheduleBlocks((current) =>
          [
            ...current.filter(
              (block) => !relatedBlocks.some((item) => item.id === block.id),
            ),
            ...relatedBlocks,
          ].sort(sortBlocks),
        );
        setOriginLinks((current) =>
          [
            ...current.filter(
              (link) => !relatedLinks.some((item) => item.id === link.id),
            ),
            ...relatedLinks,
          ].sort(sortUpdated),
        );
        throw error;
      }
      kickSync();
    },
    [
      goals,
      kickSync,
      originLinks,
      projectNodes,
      projects,
      scheduleBlocks,
      setGoals,
      setOriginLinks,
      setProjectNodes,
      setProjects,
      setScheduleBlocks,
    ],
  );

  return { addGoal, updateGoal, deleteGoal };
}
