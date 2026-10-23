import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  localDateKey,
  newId,
  nowIso,
  type OriginLink,
  type Project,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { collectDescendants, isLeafNode, wouldCreateCycle } from "@/lib/planning";
import { active, operationFor, sortBlocks, sortUpdated } from "../internals";

export function useProjectNodeMutations({
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
  const addProjectNode = useCallback(
    async (
      projectId: string,
      parentId: string | null,
      title: string,
      options: {
        confirmDecompose?: boolean;
        sourceThoughtIds?: string[];
        needsContinuousTime?: boolean;
        isFragmentFriendly?: boolean;
        importIndex?: number | null;
      } = {},
    ) => {
      const db = getPlannerDb();
      const time = nowIso();
      const nodes = projectNodes.filter((node) => node.projectId === projectId);
      const project = projects.find((item) => item.id === projectId);
      if (!project) throw new Error("找不到 Project");
      let futureBlocks: ScheduleBlock[] = [];
      if (parentId) {
        const parent = nodes.find((node) => node.id === parentId);
        if (!parent) throw new Error("找不到父节点");
        if (parent.status === "completed") {
          throw new Error("已完成叶子不能再增加子节点");
        }
        futureBlocks = scheduleBlocks.filter(
          (block) =>
            block.sourceId === parentId &&
            block.status === "planned" &&
            block.date >= localDateKey(new Date()),
        );
        if (futureBlocks.length && !options.confirmDecompose) {
          throw new Error("LEAF_HAS_SCHEDULES");
        }
      }
      const siblings = nodes.filter((node) => node.parentId === parentId);
      const node: ProjectNode = {
        id: newId("node"),
        entityType: "projectNode",
        projectId,
        parentId,
        title: title.trim(),
        order: siblings.length,
        status: "open",
        isFocused: false,
        needsContinuousTime: Boolean(options.needsContinuousTime),
        isFragmentFriendly:
          !options.needsContinuousTime && Boolean(options.isFragmentFriendly),
        sourceThoughtIds: options.sourceThoughtIds ?? [],
        importIndex: options.importIndex ?? null,
        completedAt: null,
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const projectPatch: Partial<Project> | null =
        project.initializationState !== "ready"
          ? {
              initializationState: "ready",
              updatedAt: time,
              version: project.version + 1,
            }
          : null;
      const blockUpdates = futureBlocks.map((block) => ({
        current: block,
        patch: {
          status: "skipped",
          reminderRules: [],
          updatedAt: time,
          version: block.version + 1,
        } satisfies Partial<ScheduleBlock>,
      }));
      const links = node.sourceThoughtIds.map((sourceEntityId): OriginLink => ({
        id: newId("origin"),
        entityType: "originLink",
        sourceEntityType: "thought",
        sourceEntityId,
        targetEntityType: "projectNode",
        targetEntityId: node.id,
        relationship: "created_from",
        createdAt: time,
        updatedAt: time,
        version: 1,
      }));

      setProjectNodes((current) => [...current, node].sort((a, b) => a.order - b.order));
      if (projectPatch) {
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId ? { ...item, ...projectPatch } : item,
          ),
        );
      }
      if (blockUpdates.length) {
        setScheduleBlocks((current) =>
          current
            .map((block) => {
              const update = blockUpdates.find((item) => item.current.id === block.id);
              return update ? { ...block, ...update.patch } : block;
            })
            .sort(sortBlocks),
        );
      }
      if (links.length) {
        setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
      }

      try {
        await db.transaction(
          "rw",
          [db.projects, db.projectNodes, db.scheduleBlocks, db.originLinks, db.operations],
          async () => {
            await db.projectNodes.put(node);
            if (blockUpdates.length) {
              await db.scheduleBlocks.bulkUpdate(
                blockUpdates.map(({ current, patch }) => ({ key: current.id, changes: patch })),
              );
            }
            if (projectPatch) await db.projects.update(projectId, projectPatch);
            if (links.length) await db.originLinks.bulkPut(links);
            await db.operations.bulkPut([
              operationFor(node, 0),
              ...blockUpdates.map(({ current, patch }) =>
                operationFor(
                  { ...current, ...patch },
                  current.version,
                  "upsert",
                  patch,
                ),
              ),
              ...(projectPatch
                ? [
                    operationFor(
                      { ...project, ...projectPatch },
                      project.version,
                      "upsert",
                      projectPatch,
                    ),
                  ]
                : []),
              ...links.map((link) => operationFor(link, 0)),
            ]);
          },
        );
      } catch (error) {
        setProjectNodes((current) => current.filter((item) => item.id !== node.id));
        if (projectPatch) {
          setProjects((current) =>
            current.map((item) => item.id === projectId ? project : item),
          );
        }
        if (blockUpdates.length) {
          setScheduleBlocks((current) =>
            current
              .map((block) => {
                const update = blockUpdates.find((item) => item.current.id === block.id);
                return update?.current ?? block;
              })
              .sort(sortBlocks),
          );
        }
        if (links.length) {
          setOriginLinks((current) =>
            current.filter((link) => !links.some((item) => item.id === link.id)),
          );
        }
        throw error;
      }
      kickSync();
      return node;
    },
    [
      kickSync,
      projectNodes,
      projects,
      scheduleBlocks,
      setOriginLinks,
      setProjectNodes,
      setProjects,
      setScheduleBlocks,
    ],
  );

  const updateProjectNode = useCallback(
    async (id: string, patch: Partial<ProjectNode>) => {
      const db = getPlannerDb();
      const current =
        projectNodes.find((node) => node.id === id) ?? await db.projectNodes.get(id);
      if (!current) return;
      const continuous =
        patch.needsContinuousTime ?? current.needsContinuousTime;
      const fragmentFriendly =
        patch.isFragmentFriendly ?? current.isFragmentFriendly;
      const nextPatch = {
        ...patch,
        needsContinuousTime: Boolean(continuous),
        isFragmentFriendly: Boolean(fragmentFriendly) && !continuous,
        updatedAt: nowIso(),
        version: current.version + 1,
      };
      setProjectNodes((items) =>
        items
          .map((node) => node.id === id ? { ...node, ...nextPatch } : node)
          .sort((a, b) => a.order - b.order),
      );
      try {
        await db.transaction("rw", [db.projectNodes, db.operations], async () => {
          await db.projectNodes.update(id, nextPatch);
          await db.operations.put(
            operationFor(
              { ...current, ...nextPatch },
              current.version,
              "upsert",
              nextPatch,
            ),
          );
        });
        kickSync();
      } catch (error) {
        setProjectNodes((items) =>
          items
            .map((node) => node.id === id ? current : node)
            .sort((a, b) => a.order - b.order),
        );
        throw error;
      }
    },
    [kickSync, projectNodes, setProjectNodes],
  );

  const moveProjectNode = useCallback(
    async (
      id: string,
      parentId: string | null,
      requestedOrder = Number.MAX_SAFE_INTEGER,
      confirmDecompose = false,
    ) => {
      const db = getPlannerDb();
      const current = projectNodes.find((node) => node.id === id);
      if (!current) return;
      const nodes = projectNodes.filter((node) => node.projectId === current.projectId);
      if (wouldCreateCycle(id, parentId, nodes)) throw new Error("不能把节点移动到自身后代中");
      let future: ScheduleBlock[] = [];
      if (parentId) {
        const parent = nodes.find((node) => node.id === parentId);
        if (!parent || parent.projectId !== current.projectId) {
          throw new Error("节点只能在同一个 Project 内移动");
        }
        if (parent.status === "completed" && isLeafNode(parent.id, nodes)) {
          throw new Error("已完成叶子不能再增加子节点");
        }
        future = scheduleBlocks.filter(
          (block) =>
            !block.deletedAt &&
            block.sourceId === parentId &&
            block.status === "planned" &&
            block.date >= localDateKey(new Date()),
        );
        if (future.length && !confirmDecompose) throw new Error("LEAF_HAS_SCHEDULES");
      }
      const time = nowIso();
      const blockUpdates = future.map((block) => ({
        current: block,
        patch: {
          status: "skipped" as const,
          reminderRules: [],
          updatedAt: time,
          version: block.version + 1,
        } satisfies Partial<ScheduleBlock>,
      }));
      const siblings = nodes
        .filter((node) => node.parentId === parentId && node.id !== id)
        .sort((a, b) => a.order - b.order);
      const order = Math.max(0, Math.min(requestedOrder, siblings.length));
      siblings.splice(order, 0, current);
      const nodeUpdates = siblings.map((node, index) => ({
        current: node,
        patch: {
          parentId,
          order: index,
          updatedAt: time,
          version: node.version + 1,
        } satisfies Partial<ProjectNode>,
      }));
      const nodePatchById = new Map(nodeUpdates.map(({ current: node, patch }) => [node.id, patch]));
      const blockPatchById = new Map(blockUpdates.map(({ current: block, patch }) => [block.id, patch]));
      setProjectNodes((items) =>
        items.map((node) => ({ ...node, ...nodePatchById.get(node.id) })).sort((a, b) => a.order - b.order),
      );
      if (blockUpdates.length) {
        setScheduleBlocks((items) =>
          items.map((block) => ({ ...block, ...blockPatchById.get(block.id) })).sort(sortBlocks),
        );
      }
      try {
        await db.transaction("rw", [db.projectNodes, db.scheduleBlocks, db.operations], async () => {
          await db.projectNodes.bulkUpdate(
            nodeUpdates.map(({ current: node, patch }) => ({ key: node.id, changes: patch })),
          );
          if (blockUpdates.length) {
            await db.scheduleBlocks.bulkUpdate(
              blockUpdates.map(({ current: block, patch }) => ({ key: block.id, changes: patch })),
            );
          }
          await db.operations.bulkPut([
            ...nodeUpdates.map(({ current: node, patch }) =>
              operationFor({ ...node, ...patch }, node.version, "upsert", patch),
            ),
            ...blockUpdates.map(({ current: block, patch }) =>
              operationFor({ ...block, ...patch }, block.version, "upsert", patch),
            ),
          ]);
        });
      } catch (error) {
        const previousNodes = new Map(nodeUpdates.map(({ current: node }) => [node.id, node]));
        const previousBlocks = new Map(blockUpdates.map(({ current: block }) => [block.id, block]));
        setProjectNodes((items) =>
          items.map((node) => previousNodes.get(node.id) ?? node).sort((a, b) => a.order - b.order),
        );
        if (blockUpdates.length) {
          setScheduleBlocks((items) =>
            items.map((block) => previousBlocks.get(block.id) ?? block).sort(sortBlocks),
          );
        }
        throw error;
      }
      kickSync();
    },
    [kickSync, projectNodes, scheduleBlocks, setProjectNodes, setScheduleBlocks],
  );

  const deleteProjectNode = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const root =
        projectNodes.find((node) => node.id === id) ??
        await db.projectNodes.get(id);
      if (!root) return;
      const nodes = projectNodes.filter((node) => node.projectId === root.projectId);
      const targets = [root, ...collectDescendants(id, nodes)];
      const time = nowIso();
      const targetIds = new Set(targets.map((node) => node.id));
      const blocks = scheduleBlocks.filter(
        (block) =>
          block.sourceType === "projectNode" && targetIds.has(block.sourceId),
      );
      const links = originLinks.filter(
        (link) =>
          link.targetEntityType === "projectNode" &&
          targetIds.has(link.targetEntityId),
      );
      const nodeUpdates = targets.map((node) => ({
        current: node,
        patch: {
          title: "",
          deletedAt: time,
          updatedAt: time,
          version: node.version + 1,
        } satisfies Partial<ProjectNode>,
      }));
      const blockUpdates = blocks.map((block) => ({
        current: block,
        patch: {
          deletedAt: time,
          reminderRules: [],
          updatedAt: time,
          version: block.version + 1,
        } satisfies Partial<ScheduleBlock>,
      }));
      const linkUpdates = links.map((link) => ({
        current: link,
        patch: {
          deletedAt: time,
          updatedAt: time,
          version: link.version + 1,
        } satisfies Partial<OriginLink>,
      }));

      setProjectNodes((items) => items.filter((node) => !targetIds.has(node.id)));
      setScheduleBlocks((items) =>
        items.filter(
          (block) =>
            block.sourceType !== "projectNode" || !targetIds.has(block.sourceId),
        ),
      );
      setOriginLinks((items) =>
        items.filter(
          (link) =>
            link.targetEntityType !== "projectNode" ||
            !targetIds.has(link.targetEntityId),
        ),
      );
      try {
        await db.transaction(
          "rw",
          [db.projectNodes, db.scheduleBlocks, db.originLinks, db.operations],
          async () => {
            await db.projectNodes.bulkUpdate(
              nodeUpdates.map(({ current, patch }) => ({
                key: current.id,
                changes: patch,
              })),
            );
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
            await db.operations.bulkPut([
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
        kickSync();
      } catch (error) {
        setProjectNodes((items) =>
          [...items.filter((node) => !targetIds.has(node.id)), ...targets].sort(
            (a, b) => a.order - b.order,
          ),
        );
        setScheduleBlocks((items) =>
          [...items.filter((block) => !blocks.some((item) => item.id === block.id)), ...blocks]
            .sort(sortBlocks),
        );
        setOriginLinks((items) =>
          [...items.filter((link) => !links.some((item) => item.id === link.id)), ...links]
            .sort(sortUpdated),
        );
        throw error;
      }
    },
    [
      kickSync,
      originLinks,
      projectNodes,
      scheduleBlocks,
      setOriginLinks,
      setProjectNodes,
      setScheduleBlocks,
    ],
  );

  const toggleProjectNode = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const node = await db.projectNodes.get(id);
      if (!node) return;
      const nodes = (await db.projectNodes.where("projectId").equals(node.projectId).toArray()).filter(
        active,
      );
      if (!isLeafNode(id, nodes)) throw new Error("父节点进度由叶子节点自动计算");
      const completed = node.status !== "completed";
      await updateProjectNode(id, {
        status: completed ? "completed" : "open",
        completedAt: completed ? nowIso() : null,
      });
    },
    [updateProjectNode],
  );

  const setProjectNodeFocus = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const target = projectNodes.find((node) => node.id === id);
      if (!target || target.status === "completed") return;
      const nodes = projectNodes.filter((node) => node.projectId === target.projectId);
      if (!isLeafNode(id, nodes)) throw new Error("只有可执行叶子可以设为当前推进");
      const time = nowIso();
      const nextFocused = !target.isFocused;
      const changed = nodes.filter(
        (node) => node.isFocused || (node.id === id && node.isFocused !== nextFocused),
      );
      const updates = changed.flatMap((node) => {
          const isFocused = node.id === id ? nextFocused : false;
          if (node.isFocused === isFocused) return [];
          const patch: Partial<ProjectNode> = {
            isFocused,
            updatedAt: time,
            version: node.version + 1,
          };
          return [{ current: node, patch }];
      });
      const patchById = new Map(updates.map(({ current: node, patch }) => [node.id, patch]));
      setProjectNodes((items) => items.map((node) => ({ ...node, ...patchById.get(node.id) })));
      try {
        await db.transaction("rw", [db.projectNodes, db.operations], async () => {
          await db.projectNodes.bulkUpdate(
            updates.map(({ current: node, patch }) => ({ key: node.id, changes: patch })),
          );
          await db.operations.bulkPut(
            updates.map(({ current: node, patch }) =>
              operationFor({ ...node, ...patch }, node.version, "upsert", patch),
            ),
          );
        });
      } catch (error) {
        const previousById = new Map(updates.map(({ current: node }) => [node.id, node]));
        setProjectNodes((items) => items.map((node) => previousById.get(node.id) ?? node));
        throw error;
      }
      kickSync();
    },
    [kickSync, projectNodes, setProjectNodes],
  );

  return {
    addProjectNode,
    updateProjectNode,
    moveProjectNode,
    deleteProjectNode,
    toggleProjectNode,
    setProjectNodeFocus,
  };
}
