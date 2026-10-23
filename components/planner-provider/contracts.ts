import type {
  AiRun,
  CalendarEvent,
  EventKind,
  FragmentActivity,
  FragmentMinutes,
  Goal,
  MissedNotification,
  OriginLink,
  PlannerSettings,
  PlannerTask,
  Project,
  ProjectNode,
  QuickThought,
  ReminderRule,
  ScheduleBlock,
  SyncConflict,
} from "@/lib/domain";
import type { OutlineCandidate } from "@/lib/planning";
import type { SyncState } from "@/lib/sync-client";

export interface NewTaskInput {
  title: string;
  status?: PlannerTask["status"];
  planningState?: PlannerTask["planningState"];
  notes?: string;
  taskKind?: "ordinary" | "assignment";
  dueAt?: string | null;
  scheduledStartAt?: string | null;
  durationMinutes?: number | null;
  isAllDay?: boolean;
  needsContinuousTime?: boolean;
  isFragmentFriendly?: boolean;
  recurrenceRule?: string | null;
  reminderOffsetMinutes?: number | null;
  reminderRules?: ReminderRule[];
  desiredCompletionAt?: string | null;
  actualDeadlineAt?: string | null;
  assignmentStatus?: PlannerTask["assignmentStatus"];
  courseEventId?: string | null;
  courseOccurrenceDate?: string | null;
  originThoughtIds?: string[];
  itemTypeId?: string;
  colorOverride?: string | null;
}

export interface NewEventInput {
  title: string;
  location?: string | null;
  notes?: string;
  eventKind?: EventKind;
  startAt: string;
  endAt: string;
  recurrenceRule?: string | null;
  excludedOccurrenceKeys?: string[];
  recurrenceEndAt?: string | null;
  reminderOffsetMinutes?: number | null;
  reminderRules?: ReminderRule[];
  timezone?: string;
  originThoughtIds?: string[];
  itemTypeId?: string;
  colorOverride?: string | null;
}

export interface NewScheduleBlockInput {
  sourceType: ScheduleBlock["sourceType"];
  sourceId: string;
  date: string;
  startAt?: string | null;
  endAt?: string | null;
  reminderRules?: ReminderRule[];
}

export interface PlannerContextValue {
  ready: boolean;
  thoughts: QuickThought[];
  tasks: PlannerTask[];
  events: CalendarEvent[];
  goals: Goal[];
  projects: Project[];
  projectNodes: ProjectNode[];
  scheduleBlocks: ScheduleBlock[];
  fragmentActivities: FragmentActivity[];
  notifications: MissedNotification[];
  originLinks: OriginLink[];
  aiRuns: AiRun[];
  settings: PlannerSettings;
  conflicts: SyncConflict[];
  syncState: SyncState;
  syncMessage: string;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  addThought: (content: string) => Promise<QuickThought>;
  updateThoughtStatus: (ids: string[], status: QuickThought["status"], resultLabel?: string) => Promise<void>;
  restoreThought: (id: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<PlannerTask>;
  addTasks: (inputs: NewTaskInput[]) => Promise<PlannerTask[]>;
  updateTask: (id: string, patch: Partial<PlannerTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string, occurrenceAt?: string) => Promise<void>;
  addEvent: (input: NewEventInput) => Promise<CalendarEvent>;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  convertThoughtToDraft: (id: string) => Promise<PlannerTask | null>;
  convertThoughtsToTasks: (ids: string[]) => Promise<void>;
  convertThoughtsToEvents: (ids: string[]) => Promise<void>;
  addGoal: (name: string, color?: string) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addProject: (goalId: string, title: string, sourceThoughtIds?: string[]) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project | null>;
  importProjectOutline: (
    goalId: string,
    title: string,
    candidates: OutlineCandidate[],
    sourceThoughtIds?: string[],
    targetProjectId?: string,
  ) => Promise<Project>;
  resumeProjectImport: (projectId: string) => Promise<void>;
  addProjectNode: (
    projectId: string,
    parentId: string | null,
    title: string,
    options?: {
      confirmDecompose?: boolean;
      sourceThoughtIds?: string[];
      needsContinuousTime?: boolean;
      isFragmentFriendly?: boolean;
      importIndex?: number | null;
    },
  ) => Promise<ProjectNode>;
  updateProjectNode: (id: string, patch: Partial<ProjectNode>) => Promise<void>;
  moveProjectNode: (id: string, parentId: string | null, order?: number, confirmDecompose?: boolean) => Promise<void>;
  deleteProjectNode: (id: string) => Promise<void>;
  toggleProjectNode: (id: string) => Promise<void>;
  setProjectNodeFocus: (id: string) => Promise<void>;
  addScheduleBlock: (input: NewScheduleBlockInput) => Promise<ScheduleBlock>;
  updateScheduleBlock: (id: string, patch: Partial<ScheduleBlock>) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  completeScheduleBlock: (id: string, scope: "block" | "item") => Promise<void>;
  addFragmentActivity: (title: string, eligibleMinutes: FragmentMinutes[]) => Promise<FragmentActivity>;
  updateFragmentActivity: (id: string, patch: Partial<FragmentActivity>) => Promise<void>;
  deleteFragmentActivity: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  saveSettings: (patch: Partial<PlannerSettings>) => Promise<void>;
  removeItemType: (id: string) => Promise<void>;
  saveAiRun: (run: AiRun) => Promise<void>;
  resolveConflict: (id: string, resolution: "local" | "server") => Promise<void>;
  resolveAllConflicts: (resolution: "local" | "server") => Promise<number>;
}
