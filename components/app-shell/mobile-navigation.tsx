"use client";

import type { AppNavigationValue, PlannerView } from "../app-navigation";
import { handleNavigation, mobileNav } from "./navigation";

type MobileNavigationProps = {
  view: PlannerView;
  inboxCount: number;
  deadlinesCount?: number;
  navigate: AppNavigationValue["navigate"];
  onQuickMode: (mode: "capture") => void;
  onOpenSettings?: () => void;
};

export function MobileNavigation({
  view,
  navigate,
}: MobileNavigationProps) {
  return (
    <>
      {/* 3-tab Mobile Bottom Navigation: Today | Calendar | 设置 */}
      <nav className="bottom-nav" id="mobile-more-menu" aria-label="移动端导航">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view;
          return (
            <a
              key={item.view}
              href={item.href}
              className={isActive ? "is-active" : ""}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleNavigation(event, item.view, navigate)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
