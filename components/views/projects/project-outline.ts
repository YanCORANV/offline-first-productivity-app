import type { OutlineCandidate } from "@/lib/planning";

export type ProjectViewMode = "outline" | "map" | "markdown";

export function normalizeCandidateParents(candidates: OutlineCandidate[]) {
  const depthIndexes: number[] = [];
  return candidates
    .filter((candidate) => candidate.title.trim())
    .map((candidate, index, validCandidates) => {
      const previousDepth = index ? validCandidates[index - 1].depth : 0;
      const depth = Math.max(0, Math.min(candidate.depth, index ? previousDepth + 1 : 0));
      while (depthIndexes.length > depth) depthIndexes.pop();
      const parentIndex = depth === 0 ? null : depthIndexes[depth - 1] ?? null;
      depthIndexes[depth] = index;
      return { ...candidate, depth: parentIndex == null ? 0 : depth, parentIndex };
    });
}
