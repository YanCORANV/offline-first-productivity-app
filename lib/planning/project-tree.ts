import type {
  Goal,
  PlannerTask,
  Project,
  ProjectNode,
  ScheduleBlock,
} from "../domain.ts";

export interface ProjectTreeIndex {
  childrenByParentId: Map<string | null, ProjectNode[]>;
  leafIds: Set<string>;
  progressByNodeId: Map<string, { completed: number; total: number }>;
}

export function buildProjectTreeIndex(nodes: ProjectNode[]): ProjectTreeIndex {
  const activeNodes = nodes.filter((node) => !node.deletedAt);
  const childrenByParentId = new Map<string | null, ProjectNode[]>();
  for (const node of activeNodes) {
    const children = childrenByParentId.get(node.parentId) ?? [];
    children.push(node);
    childrenByParentId.set(node.parentId, children);
  }
  for (const children of childrenByParentId.values()) {
    children.sort((a, b) => a.order - b.order);
  }

  const leafIds = new Set(
    activeNodes
      .filter((node) => !(childrenByParentId.get(node.id)?.length))
      .map((node) => node.id),
  );
  const progressByNodeId = new Map<string, { completed: number; total: number }>();
  const visiting = new Set<string>();
  const progressFor = (node: ProjectNode): { completed: number; total: number } => {
    const cached = progressByNodeId.get(node.id);
    if (cached) return cached;
    if (visiting.has(node.id)) return { completed: 0, total: 0 };
    visiting.add(node.id);
    const children = childrenByParentId.get(node.id) ?? [];
    const progress = children.length
      ? children.reduce(
          (total, child) => {
            const childProgress = progressFor(child);
            total.completed += childProgress.completed;
            total.total += childProgress.total;
            return total;
          },
          { completed: 0, total: 0 },
        )
      : { completed: node.status === "completed" ? 1 : 0, total: 1 };
    visiting.delete(node.id);
    progressByNodeId.set(node.id, progress);
    return progress;
  };
  for (const node of activeNodes) progressFor(node);

  return { childrenByParentId, leafIds, progressByNodeId };
}

export function nodeChildren(nodes: ProjectNode[], parentId: string | null): ProjectNode[] {
  return nodes
    .filter((node) => node.parentId === parentId && !node.deletedAt)
    .sort((a, b) => a.order - b.order);
}

export function isLeafNode(nodeId: string, nodes: ProjectNode[]): boolean {
  return !nodes.some((node) => node.parentId === nodeId && !node.deletedAt);
}

export function projectProgress(projectId: string, nodes: ProjectNode[]) {
  const leaves = nodes.filter(
    (node) => node.projectId === projectId && !node.deletedAt && isLeafNode(node.id, nodes),
  );
  const completed = leaves.filter((node) => node.status === "completed").length;
  return {
    completed,
    total: leaves.length,
    ratio: leaves.length ? completed / leaves.length : 0,
    allStepsDone: leaves.length > 0 && completed === leaves.length,
  };
}

export function nodeProgress(nodeId: string, nodes: ProjectNode[]) {
  const descendants = collectDescendants(nodeId, nodes);
  const leaves = descendants.filter((node) => isLeafNode(node.id, nodes));
  if (!leaves.length) {
    const node = nodes.find((item) => item.id === nodeId);
    return { completed: node?.status === "completed" ? 1 : 0, total: 1 };
  }
  return {
    completed: leaves.filter((node) => node.status === "completed").length,
    total: leaves.length,
  };
}

export function collectDescendants(nodeId: string, nodes: ProjectNode[]): ProjectNode[] {
  const result: ProjectNode[] = [];
  const queue = [nodeId];
  while (queue.length) {
    const parent = queue.shift()!;
    for (const child of nodes.filter((node) => node.parentId === parent && !node.deletedAt)) {
      result.push(child);
      queue.push(child.id);
    }
  }
  return result;
}

export function wouldCreateCycle(
  nodeId: string,
  candidateParentId: string | null,
  nodes: ProjectNode[],
): boolean {
  if (!candidateParentId) return false;
  if (nodeId === candidateParentId) return true;
  return collectDescendants(nodeId, nodes).some((node) => node.id === candidateParentId);
}

export function taskTitleForBlock(
  block: ScheduleBlock,
  tasks: PlannerTask[],
  nodes: ProjectNode[],
): string {
  return block.sourceType === "task"
    ? tasks.find((task) => task.id === block.sourceId)?.title ?? "已删除任务"
    : nodes.find((node) => node.id === block.sourceId)?.title ?? "已删除项目任务";
}

export function projectPath(
  nodeId: string,
  nodes: ProjectNode[],
  projects: Project[],
  goals: Goal[],
): string {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return "";
  const project = projects.find((item) => item.id === node.projectId);
  const goal = goals.find((item) => item.id === project?.goalId);
  const names: string[] = [];
  let current = node.parentId ? nodes.find((item) => item.id === node.parentId) : undefined;
  while (current) {
    names.unshift(current.title);
    current = current.parentId
      ? nodes.find((item) => item.id === current?.parentId)
      : undefined;
  }
  return [goal?.name, project?.title, ...names].filter(Boolean).join(" › ");
}
