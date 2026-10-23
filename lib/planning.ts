export { parseProjectMarkdown, parseProjectOutline } from "./planning/project-outline.ts";
export type { OutlineCandidate, ParsedProjectMarkdown } from "./planning/project-outline.ts";

export {
  buildProjectTreeIndex,
  collectDescendants,
  isLeafNode,
  nodeChildren,
  nodeProgress,
  projectPath,
  projectProgress,
  taskTitleForBlock,
  wouldCreateCycle,
} from "./planning/project-tree.ts";
export type { ProjectTreeIndex } from "./planning/project-tree.ts";

export {
  buildCalendarTimelineScale,
  buildCompactTimelineScale,
  compactTimelineMinuteAtY,
  compactTimelineY,
  formatGapDuration,
  resolveTimelineWindow,
  timelineOffsetMinutes,
} from "./planning/timeline.ts";
export type {
  CompactTimelineScale,
  CompactTimelineSegment,
  TimelineInterval,
  TimelineWindow,
} from "./planning/timeline.ts";

export {
  buildAdvanceCandidates,
  freeTimeRanges,
  recommendCandidatesForGaps,
  recommendationLimit,
  recommendationTargetDate,
} from "./planning/recommendations.ts";
export type { AdvanceCandidate, FreeTimeRange } from "./planning/recommendations.ts";

export {
  buildChatGptContext,
  buildProjectMarkdown,
} from "./planning/project-markdown.ts";

export { nextCourseTaskSlot } from "./planning/course-tasks.ts";
export type { CourseTaskSlot } from "./planning/course-tasks.ts";
