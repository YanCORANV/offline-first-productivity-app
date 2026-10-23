export interface OutlineCandidate {
  id: string;
  title: string;
  depth: number;
  parentIndex: number | null;
  checkpoint?: boolean;
  warning?: string;
}

export function parseProjectOutline(input: string): OutlineCandidate[] {
  const candidates: OutlineCandidate[] = [];
  const depthIndexes: number[] = [];
  const body = input.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
  for (const raw of body.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (/^\s*#\s+/.test(raw) && candidates.length === 0) continue;
    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const bullet = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+/);
    const heading = raw.match(/^\s*(#{1,6})\s+/);
    const checkpoint = /^\s*[-*+]\s+\[[ xX]\]\s+/.test(raw);
    const title = raw
      .replace(/^\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/, "")
      .trim();
    if (!title) continue;
    const depth = heading
      ? Math.max(0, heading[1].length - 1)
      : Math.floor(leading.replace(/\t/g, "  ").length / 2);
    while (depthIndexes.length > depth) depthIndexes.pop();
    const parentIndex = depth === 0 ? null : depthIndexes[depth - 1] ?? null;
    const warning =
      depth > 0 && parentIndex == null
        ? "缩进缺少上级，将暂时放在根节点"
        : !bullet && !heading && leading.length === 0
          ? "未识别到列表标记"
          : undefined;
    const index = candidates.length;
    candidates.push({
      id: `outline-${index}`,
      title,
      depth: parentIndex == null ? 0 : depth,
      parentIndex,
      checkpoint,
      warning,
    });
    depthIndexes[depth] = index;
  }
  return candidates;
}

export interface ParsedProjectMarkdown {
  goal: string;
  project: string;
  candidates: OutlineCandidate[];
  errors: string[];
}

export function parseProjectMarkdown(input: string): ParsedProjectMarkdown {
  const errors: string[] = [];
  const frontmatter = input.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const metadata = new Map<string, string>();
  if (frontmatter) {
    for (const line of frontmatter[1].split(/\r?\n/)) {
      const match = line.match(/^([a-zA-Z]+):\s*(.+)$/);
      if (match) metadata.set(match[1].toLowerCase(), match[2].trim());
    }
  } else {
    errors.push("缺少文件开头的 Goal 和 Project 信息");
  }
  const project =
    metadata.get("project") ??
    input.match(/^\s*#\s+(.+)$/m)?.[1]?.trim() ??
    "";
  const goal = metadata.get("goal") ?? "";
  if (!goal) errors.push("没有写明 goal");
  if (!project) errors.push("没有写明 project");
  const candidates = parseProjectOutline(input);
  if (!candidates.length) errors.push("没有识别到任何 Bullet Point");
  for (const candidate of candidates) {
    if (candidate.warning) errors.push(`${candidate.title}：${candidate.warning}`);
  }
  const parentIndexes = new Set(
    candidates
      .map((candidate) => candidate.parentIndex)
      .filter((index): index is number => index != null),
  );
  candidates.forEach((candidate, index) => {
    if (!parentIndexes.has(index) && candidate.checkpoint === false) {
      candidate.warning = "叶子节点应使用 - [ ]";
      errors.push(`${candidate.title}：叶子节点应使用 - [ ]`);
    }
  });
  return { goal, project, candidates, errors: [...new Set(errors)] };
}
