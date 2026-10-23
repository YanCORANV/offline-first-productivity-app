import type { PlannerSettings } from "@/lib/domain";

const editableSettingsFields = [
  "defaultWakeTime", "defaultSleepTime", "calendarDisplayStart", "calendarDisplayEnd",
  "inboxAgeHours", "timezone", "lastTimezonePrompt", "itemTypes",
] as const;

export function mergeSettingsForm(
  previous: PlannerSettings,
  draft: PlannerSettings,
  incoming: PlannerSettings,
): PlannerSettings {
  const rolledBack = incoming.version < previous.version;
  const edits = editableSettingsFields
    .filter((key) => rolledBack || JSON.stringify(draft[key]) !== JSON.stringify(previous[key]))
    .map((key) => [key, draft[key]]);
  return { ...incoming, ...Object.fromEntries(edits) };
}

export interface ServiceStatus {
  cloud: "connected" | "unconfigured";
  push: "connected" | "unconfigured";
}
