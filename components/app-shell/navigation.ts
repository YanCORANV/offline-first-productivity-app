import type { MouseEvent } from "react";
import type { AppNavigationValue, NavigationIntent, PlannerView } from "../app-navigation";
import {
  CalendarRange,
  CheckSquare2,
  FolderTree,
  Inbox,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  view: Exclude<PlannerView, "quick" | "focus" | "plan">;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const desktopNav: NavItem[] = [
  { view: "today", label: "Today", href: "/today", icon: CheckSquare2 },
  { view: "calendar", label: "Calendar", href: "/calendar", icon: CalendarRange },
  { view: "projects", label: "Projects", href: "/projects", icon: FolderTree },
];

export const mobileNav: NavItem[] = [
  { view: "today", label: "Today", href: "/today", icon: CheckSquare2 },
  { view: "calendar", label: "Calendar", href: "/calendar", icon: CalendarRange },
  { view: "settings", label: "设置", href: "/settings", icon: Settings },
];

export const mobileMoreNav: NavItem[] = [
  { view: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function handleNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  view: PlannerView,
  navigate: AppNavigationValue["navigate"],
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  navigate(view);
}

export function viewFromPath(pathname: string): PlannerView {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "today";
  if (segment === "plan") return "calendar";
  if (segment === "inbox") return "today";
  if (
    ["today", "quick", "focus", "calendar", "projects", "settings"].includes(
      segment,
    )
  ) {
    return segment as PlannerView;
  }
  return "today";
}

export function navigationUrl(view: PlannerView, intent: NavigationIntent): string {
  const normalized = view === "plan" ? "calendar" : view;
  const params = new URLSearchParams();
  if (intent.thoughtId) params.set("thought", intent.thoughtId);
  if (intent.projectId) params.set("project", intent.projectId);
  if (intent.taskId) params.set("task", intent.taskId);
  if (intent.openCandidates) params.set("candidates", "1");
  if (intent.initializeProject) params.set("initialize", "1");
  if (intent.returnTo) params.set("return", intent.returnTo);
  const query = params.toString();
  return `/${normalized}${query ? `?${query}` : ""}`;
}

export function readIntent(search: string): NavigationIntent {
  const params = new URLSearchParams(search);
  const returnTo = params.get("return");
  return {
    thoughtId: params.get("thought") ?? undefined,
    projectId: params.get("project") ?? undefined,
    taskId: params.get("task") ?? undefined,
    openCandidates: params.get("candidates") === "1",
    initializeProject: params.get("initialize") === "1",
    returnTo:
      returnTo &&
      ["today", "calendar", "projects", "inbox", "settings"].includes(returnTo)
        ? (returnTo as NavigationIntent["returnTo"])
        : undefined,
  };
}
