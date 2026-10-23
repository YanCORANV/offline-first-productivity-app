import type { QuickThought } from "@/lib/domain";
import { AlignLeft } from "lucide-react";

export function TaskNotesSection({
  notes,
  origins,
  onNotesChange,
}: {
  notes: string;
  origins?: QuickThought[];
  onNotesChange: (value: string) => void;
}) {
  return (
    <section className="task-notes-section">
      <div className="apple-attribute-row is-notes-row">
        <div className="apple-attr-label-cell">
          <AlignLeft size={16} aria-hidden="true" className="apple-attr-icon" />
          <span>备注</span>
        </div>
        <div className="apple-attr-control-cell apple-notes-control-cell">
          <label className="field apple-field apple-notes-field">
            <div className="apple-notes-input-wrapper">
              <textarea
                value={notes}
                maxLength={500}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="添加备注信息... (可选)"
              />
              <span className="apple-char-counter" aria-hidden="true">
                {notes.length}/500
              </span>
            </div>
          </label>
        </div>
      </div>
      {origins?.length ? (
        <details className="origin-details">
          <summary>来自 {origins.length} 条 Quick Thought</summary>
          {origins.map((thought) => <p key={thought.id}>{thought.content || "原想法已删除"}</p>)}
        </details>
      ) : null}
    </section>
  );
}
