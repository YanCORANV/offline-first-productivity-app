import type { Dispatch, SetStateAction } from "react";
import type {
  CalendarEvent,
  Goal,
  OriginLink,
  PlannerTask,
  Project,
  ProjectNode,
  ScheduleBlock,
} from "@/lib/domain";
import { useGoalMutations } from "./project/goal-mutations";
import { useProjectEntityMutations } from "./project/project-entity-mutations";
import { useProjectNodeMutations } from "./project/project-node-mutations";
import { useProjectImportMutations } from "./project/project-import-mutations";

export function useProjectMutations({
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
  addOriginLinks,
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
  addOriginLinks: (
    sourceThoughtIds: string[],
    target: PlannerTask | CalendarEvent | Project | ProjectNode,
  ) => Promise<void>;
  kickSync: () => void;
}) {
  const goalMutations = useGoalMutations({
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
  });
  const projectMutations = useProjectEntityMutations({
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
  });
  const nodeMutations = useProjectNodeMutations({
    projects,
    projectNodes,
    scheduleBlocks,
    originLinks,
    setProjects,
    setProjectNodes,
    setScheduleBlocks,
    setOriginLinks,
    kickSync,
  });
  const importMutations = useProjectImportMutations({
    projects,
    projectNodes,
    scheduleBlocks,
    originLinks,
    setProjects,
    setProjectNodes,
    setScheduleBlocks,
    setOriginLinks,
    kickSync,
  });

  return { ...goalMutations, ...projectMutations, ...nodeMutations, ...importMutations };
}
