"use client";

import { CalendarPlus, FolderPlus, Trash2 } from "lucide-react";
import type { Goal, QuickThought } from "@/lib/domain";
import { InboxProjectPanel, type InboxProjectInput } from "./inbox-project-panel";

export function InboxItem({
  thought,
  goals,
  rowBusy,
  projectOpen,
  onConvert,
  onBeginProject,
  onDelete,
  onCloseProject,
  onConfirmProject,
}: {
  thought: QuickThought;
  goals: Goal[];
  rowBusy: boolean;
  projectOpen: boolean;
  onConvert: () => void;
  onBeginProject: () => void;
  onDelete: () => void;
  onCloseProject: () => void;
  onConfirmProject: (input: InboxProjectInput) => void;
}) {
  return (
    <article className="inbox-item">
      <div className="inbox-item-content">
        <span className="inbox-thought-dot" />
        <span>
          <strong>{thought.content}</strong>
          <small>{formatCapturedAt(thought.createdAt)}</small>
        </span>
      </div>
      <div className="inbox-item-actions">
        <button type="button" disabled={rowBusy} onClick={onConvert}>
          <CalendarPlus size={15} /><span>转为事项</span>
        </button>
        <button type="button" disabled={rowBusy} onClick={onBeginProject}>
          <FolderPlus size={15} /><span>开始 Project</span>
        </button>
        <button className="danger-action" type="button" disabled={rowBusy} onClick={onDelete}>
          <Trash2 size={15} /><span>删除</span>
        </button>
      </div>
      {projectOpen ? (
        <InboxProjectPanel
          thought={thought}
          goals={goals}
          busy={rowBusy}
          onClose={onCloseProject}
          onConfirm={onConfirmProject}
        />
      ) : null}
    </article>
  );
}

function formatCapturedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
