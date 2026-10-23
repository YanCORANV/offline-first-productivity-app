"use client";

import { createContext, useContext } from "react";

export type PlannerView =
  | "today"
  | "quick"
  | "focus"
  | "inbox"
  | "calendar"
  | "plan"
  | "projects"
  | "settings";

export interface NavigationIntent {
  thoughtId?: string;
  projectId?: string;
  taskId?: string;
  nodeId?: string;
  openCandidates?: boolean;
  initializeProject?: boolean;
  returnTo?: Exclude<PlannerView, "plan" | "quick" | "focus">;
}

export interface AppNavigationValue {
  view: PlannerView;
  intent: NavigationIntent;
  navigate: (view: PlannerView, intent?: NavigationIntent) => void;
}

export const AppNavigationContext = createContext<AppNavigationValue | null>(null);

export function useAppNavigation(): AppNavigationValue {
  const value = useContext(AppNavigationContext);
  if (!value) throw new Error("useAppNavigation must be used inside PlannerApp");
  return value;
}
