import type { Goal, Project, ProjectNode } from "../domain.ts";
import { isLeafNode, nodeChildren } from "./project-tree.ts";

export function buildChatGptContext(
  goal: Goal,
  project: Project,
  nodes: ProjectNode[],
): string {
  const lines = [buildProjectMarkdown(goal, project, nodes), "", "---", ""];
  lines.push("请与我讨论并完善这个 Project。最后只返回一份完整 Markdown，保持原有 frontmatter、缩进和 Checklist 格式。");
  return lines.join("\n");
}

export function buildProjectMarkdown(
  goal: Goal,
  project: Project,
  nodes: ProjectNode[],
): string {
  const lines = [
    "---",
    `goal: ${goal.name}`,
    `project: ${project.title}`,
    "---",
    "",
    `# ${project.title}`,
    "",
  ];
  const visit = (parentId: string | null, depth: number) => {
    for (const node of nodeChildren(
      nodes.filter((item) => item.projectId === project.id),
      parentId,
    )) {
      const leaf = isLeafNode(node.id, nodes);
      const bullet = leaf
        ? `- [${node.status === "completed" ? "x" : " "}]`
        : "-";
      lines.push(`${"  ".repeat(depth)}${bullet} ${node.title}`);
      visit(node.id, depth + 1);
    }
  };
  visit(null, 0);
  return lines.join("\n");
}
