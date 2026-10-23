"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlannerProvider, usePlanner } from "../planner-provider";
import { QuickActionsPanel } from "../quick-actions-panel";
import { InspectorShell } from "../composers";
import {
  AppNavigationContext,
  type NavigationIntent,
  type PlannerView,
} from "../app-navigation";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { AppStartupSkeleton, ActivePlannerView, ViewLoader } from "./view-loader";
import { navigationUrl, readIntent, viewFromPath } from "./navigation";
import { useAppViewport } from "./use-app-viewport";

const SettingsModal = lazy(() =>
  import("../views/settings-view").then((module) => ({ default: module.SettingsModal })),
);

export function PlannerAppShell({ initialView }: { initialView: PlannerView }) {
  return (
    <PlannerProvider>
      <PlannerShell initialView={initialView} />
    </PlannerProvider>
  );
}

function getScrollPosition(): number {
  if (typeof window === "undefined") return 0;
  const container = document.querySelector<HTMLElement>(".page-container");
  if (container && window.innerWidth <= 767) {
    return container.scrollTop;
  }
  return window.scrollY;
}

function restoreScrollPosition(top: number) {
  if (typeof window === "undefined") return;
  const container = document.querySelector<HTMLElement>(".page-container");
  if (container && window.innerWidth <= 767) {
    container.scrollTo({ top, behavior: "auto" });
  } else {
    window.scrollTo({ top, behavior: "auto" });
  }
}

function PlannerShell({ initialView }: { initialView: PlannerView }) {
  useAppViewport();
  const { ready, thoughts, tasks } = usePlanner();
  const [view, setView] = useState<PlannerView>(initialView);
  const [intent, setIntent] = useState<NavigationIntent>(() =>
    typeof window === "undefined" ? {} : readIntent(window.location.search),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const viewRef = useRef<PlannerView>(initialView);
  const scrollByView = useRef<Partial<Record<PlannerView, number>>>({});

  const [quickMode, setQuickMode] = useState<"capture" | null>(null);
  const inboxCount = useMemo(
    () => thoughts.filter((thought) => thought.status === "inbox").length,
    [thoughts],
  );
  const deadlinesCount = useMemo(
    () => tasks.filter((task) => Boolean(task.actualDeadlineAt || task.desiredCompletionAt || task.dueAt) && task.status !== "completed").length,
    [tasks],
  );

  useEffect(() => { viewRef.current = view; }, [view]);

  const navigate = useCallback((nextView: PlannerView, nextIntent: NavigationIntent = {}) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const normalized = nextView === "plan" ? "calendar" : nextView;
    const currentView = viewRef.current;
    if (currentView !== normalized) scrollByView.current[currentView] = getScrollPosition();
    window.history.pushState({ quietPlanView: normalized, quietPlanIntent: nextIntent }, "", navigationUrl(normalized, nextIntent));
    setView(normalized);
    setIntent(nextIntent);

    if (currentView !== normalized) {
      window.requestAnimationFrame(() => restoreScrollPosition(scrollByView.current[normalized] ?? 0));
    }
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const preload = () => {
      void Promise.all([
        import("../views/today-view"),
        import("../views/calendar/calendar-view"),
        import("../views/projects-view"),
        import("../views/inbox-view"),
        import("../views/settings-view"),
      ]);
    };
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1_500 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timerId = setTimeout(preload, 500);
    return () => clearTimeout(timerId);
  }, [ready]);

  useEffect(() => {
    const onPopState = () => {
      const nextView = viewFromPath(window.location.pathname);
      scrollByView.current[viewRef.current] = getScrollPosition();
      setView(nextView);
      setIntent(readIntent(window.location.search));

      setQuickMode(null);
      window.requestAnimationFrame(() => restoreScrollPosition(scrollByView.current[nextView] ?? 0));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigation = { view, intent, navigate };
  if (view === "quick" || view === "focus") {
    return (
      <AppNavigationContext.Provider value={navigation}>
        <Suspense fallback={<ViewLoader />}>
          {view === "quick" ? <QuickView /> : <FocusView />}
        </Suspense>
      </AppNavigationContext.Provider>
    );
  }

  return (
    <AppNavigationContext.Provider value={navigation}>
      <div className="app-shell">
        <DesktopSidebar
          view={view}
          inboxCount={inboxCount}
          navigate={navigate}
          onQuickMode={setQuickMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="main-surface">
          <MobileNavigation
            view={view}
            inboxCount={inboxCount}
            deadlinesCount={deadlinesCount}
            navigate={navigate}
            onQuickMode={setQuickMode}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <div className="page-container persistent-view-stack">
            {!ready ? <AppStartupSkeleton /> : null}
            {ready ? <ActivePlannerView view={view} /> : null}
          </div>
        </main>
        {quickMode ? (
          <InspectorShell title="记录想法" onClose={() => setQuickMode(null)} panelClassName="quick-actions-inspector">
            <QuickActionsPanel mode={quickMode} onClose={() => setQuickMode(null)} />
          </InspectorShell>
        ) : null}
        {settingsOpen ? (
          <SettingsModal onClose={handleCloseSettings} />
        ) : null}
      </div>
    </AppNavigationContext.Provider>
  );
}

const QuickView = lazy(() =>
  import("../views/quick-view").then((module) => ({ default: module.QuickView })),
);
const FocusView = lazy(() =>
  import("../views/focus-view").then((module) => ({ default: module.FocusView })),
);
