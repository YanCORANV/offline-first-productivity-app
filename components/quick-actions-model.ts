import {
  buildAdvanceCandidates,
  recommendationTargetDate,
} from "@/lib/planning";
import type {
  FragmentActivity,
  Goal,
  PlannerTask,
  Project,
  ProjectNode,
  QuickThought,
  ScheduleBlock,
} from "@/lib/domain";

export const DURATION_OPTIONS = [15, 30, 60, 90] as const;
export type QuickDuration = (typeof DURATION_OPTIONS)[number];

export type QuickCandidate = {
  id: string;
  title: string;
  caption: string;
  kind: "task" | "node" | "inbox" | "activity";
};

export function buildQuickCandidates({
  duration,
  tasks,
  thoughts,
  goals,
  projects,
  projectNodes,
  scheduleBlocks,
  fragmentActivities,
}: {
  duration: QuickDuration | null;
  tasks: PlannerTask[];
  thoughts: QuickThought[];
  goals: Goal[];
  projects: Project[];
  projectNodes: ProjectNode[];
  scheduleBlocks: ScheduleBlock[];
  fragmentActivities: FragmentActivity[];
}): QuickCandidate[] {
  if (!duration) return [];
  const sharedCandidates = buildAdvanceCandidates({
    tasks,
    projectNodes,
    projects,
    goals,
    scheduleBlocks,
    targetDate: recommendationTargetDate(new Date()),
  })
    .filter((candidate) => candidate.isFragmentFriendly && !candidate.startsLater)
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      caption: candidate.caption,
      kind: candidate.source.entityType === "task" ? ("task" as const) : ("node" as const),
    }));
  const inboxCount = thoughts.filter((thought) => thought.status === "inbox").length;
  const result: QuickCandidate[] = [
    ...sharedCandidates,
    ...(inboxCount
      ? [{
          id: "inbox",
          title: `整理 Inbox（${inboxCount} 条）`,
          caption: "把一个想法落实为下一步",
          kind: "inbox" as const,
        }]
      : []),
    ...fragmentActivities
      .filter((activity) => activity.enabled && activity.eligibleMinutes.includes(duration))
      .map((activity) => ({
        id: activity.id,
        title: activity.title,
        caption: "固定碎片活动",
        kind: "activity" as const,
      })),
  ];
  if (!result.length) {
    result.push({
      id: "quiet-break",
      title: "离开屏幕，安静休息一下",
      caption: "没有必须填满的空白时间",
      kind: "activity",
    });
  }
  return result.slice(0, 3);
}
