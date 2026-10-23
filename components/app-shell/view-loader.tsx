"use client";

import { lazy, Suspense } from "react";
import type { PlannerView } from "../app-navigation";

const TodayView = lazy(() =>
  import("../views/today-view").then((module) => ({ default: module.TodayView })),
);
const InboxView = lazy(() =>
  import("../views/inbox-view").then((module) => ({ default: module.InboxView })),
);
const CalendarView = lazy(() =>
  import("../views/calendar/calendar-view").then((module) => ({ default: module.CalendarView })),
);
const ProjectsView = lazy(() =>
  import("../views/projects-view").then((module) => ({ default: module.ProjectsView })),
);
const SettingsView = lazy(() =>
  import("../views/settings-view").then((module) => ({ default: module.SettingsView })),
);
const QuickView = lazy(() =>
  import("../views/quick-view").then((module) => ({ default: module.QuickView })),
);

export function ViewLoader() {
  return <div className="view-loader" aria-label="正在准备页面"><span /></div>;
}

export function AppStartupSkeleton() {
  return (
    <div className="app-startup-skeleton" aria-label="正在打开计划">
      <span className="skeleton-line is-title" />
      <span className="skeleton-line is-copy" />
      <div className="skeleton-workspace"><span /><span /></div>
    </div>
  );
}

export function ActivePlannerView({ view }: { view: PlannerView }) {
  let content;
  if (view === "quick") content = <QuickView />;
  else if (view === "today") content = <TodayView />;
  else if (view === "inbox") content = <TodayView defaultInboxExpanded />;
  else if (view === "calendar" || view === "plan") content = <CalendarView />;
  else if (view === "projects") content = <ProjectsView />;
  else if (view === "settings") content = <SettingsView />;
  else content = <TodayView />;

  return (
    <section className="planner-view is-active">
      <Suspense fallback={<ViewLoader />}>{content}</Suspense>
    </section>
  );
}
