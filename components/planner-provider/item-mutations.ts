import type { Dispatch, SetStateAction } from "react";
import type {
  CalendarEvent,
  OriginLink,
  PlannerSettings,
  PlannerTask,
  QuickThought,
  ScheduleBlock,
} from "@/lib/domain";
import { useOriginLinkMutations } from "./item/origin-link-mutations";
import { useThoughtMutations } from "./item/thought-mutations";
import { useTaskMutations } from "./item/task-mutations";
import { useEventMutations } from "./item/event-mutations";
import { useThoughtConversions } from "./item/thought-conversions";

export function useItemMutations({
  thoughts,
  tasks,
  events,
  settings,
  setThoughts,
  setTasks,
  setEvents,
  setScheduleBlocks,
  setOriginLinks,
  kickSync,
}: {
  thoughts: QuickThought[];
  tasks: PlannerTask[];
  events: CalendarEvent[];
  settings: PlannerSettings;
  setThoughts: Dispatch<SetStateAction<QuickThought[]>>;
  setTasks: Dispatch<SetStateAction<PlannerTask[]>>;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  setScheduleBlocks: Dispatch<SetStateAction<ScheduleBlock[]>>;
  setOriginLinks: Dispatch<SetStateAction<OriginLink[]>>;
  kickSync: () => void;
}) {
  const { addOriginLinks } = useOriginLinkMutations({ setOriginLinks });
  const thoughtMutations = useThoughtMutations({ thoughts, settings, setThoughts, kickSync });
  const taskMutations = useTaskMutations({
    tasks,
    setTasks,
    setScheduleBlocks,
    setOriginLinks,
    kickSync,
  });
  const eventMutations = useEventMutations({
    events,
    settings,
    setEvents,
    addOriginLinks,
    kickSync,
  });
  const conversions = useThoughtConversions({
    thoughts,
    tasks,
    setThoughts,
    setTasks,
    setOriginLinks,
    addEvent: eventMutations.addEvent,
    updateThoughtStatus: thoughtMutations.updateThoughtStatus,
    kickSync,
  });

  return {
    addOriginLinks,
    ...thoughtMutations,
    ...taskMutations,
    ...eventMutations,
    ...conversions,
  };
}
