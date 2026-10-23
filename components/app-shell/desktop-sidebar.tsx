"use client";

import { Settings } from "lucide-react";
import type { AppNavigationValue, PlannerView } from "../app-navigation";
import { SyncPill } from "../ui";
import { desktopNav, handleNavigation } from "./navigation";
import { SidebarMemo } from "./sidebar-memo";

type DesktopSidebarProps = {
  view: PlannerView;
  inboxCount: number;
  navigate: AppNavigationValue["navigate"];
  onQuickMode?: (mode: "capture") => void;
  onOpenSettings?: () => void;
};

export function DesktopSidebar({
  view,
  inboxCount,
  navigate,
  onOpenSettings,
}: DesktopSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>Yan’s Plan</span>
      </div>
      <nav className="sidebar-nav" aria-label="主要导航">
        {desktopNav.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.view}
              href={item.href}
              className={view === item.view ? "is-active" : ""}
              aria-current={view === item.view ? "page" : undefined}
              onClick={(event) => handleNavigation(event, item.view, navigate)}
            >
              <Icon size={18} /><span>{item.label}</span>
              {item.view === "inbox" && inboxCount ? <strong>{inboxCount}</strong> : null}
            </a>
          );
        })}
      </nav>
      <SidebarMemo />
      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <SyncPill />
          <button
            type="button"
            className="sidebar-settings-btn"
            onClick={onOpenSettings}
            title="设置"
            aria-label="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
