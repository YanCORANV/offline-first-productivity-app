"use client";

import { PlannerAppShell } from "./app-shell/planner-shell";
import type { PlannerView } from "./app-navigation";

export type { NavigationIntent, PlannerView } from "./app-navigation";

export function PlannerApp({ view }: { view: PlannerView }) {
  return <PlannerAppShell initialView={view === "plan" ? "calendar" : view} />;
}
