"use client";

import "./quick.css";

import { Timer } from "lucide-react";
import { QuickActionsPanel } from "../../quick-actions-panel";

export function FocusView() {
  return (
    <div className="quick-page quick-focus-page">
      <a className="quick-page-brand" href="/today">
        <Timer size={18} />Quiet Plan
      </a>
      <div className="quick-page-center quick-focus-page-center">
        <p className="eyebrow">Quick Focus</p>
        <h1>我有一点时间</h1>
        <QuickActionsPanel mode="focus" onClose={() => undefined} />
      </div>
      <a className="quick-back-link" href="/today">返回今天</a>
    </div>
  );
}
