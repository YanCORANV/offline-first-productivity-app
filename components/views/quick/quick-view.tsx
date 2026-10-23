"use client";

import "./quick.css";

import { Check, Lightbulb, WifiOff } from "lucide-react";
import { useState } from "react";
import { usePlanner } from "../../planner-provider";
import { QuickCapture } from "../../ui";

export function QuickView() {
  const { syncState } = usePlanner();
  const [saved, setSaved] = useState(false);
  return (
    <div className="quick-page">
      <a className="quick-page-brand" href="/today">
        <Lightbulb size={18} />Quiet Plan
      </a>
      <div className="quick-page-center">
        <p className="eyebrow">Quick Thought</p>
        <h1>记录想法</h1>
        <QuickCapture
          compact
          autoFocus
          onSaved={() => {
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
          }}
        />
        <div className="quick-save-state" role="status">
          {saved ? (
            <><Check size={14} /> 已进入 Inbox</>
          ) : syncState === "offline" || syncState === "unconfigured" ? (
            <><WifiOff size={14} /> 即使离线也会保存</>
          ) : (
            null
          )}
        </div>
      </div>
      <a className="quick-back-link" href="/today">返回今天</a>
    </div>
  );
}
