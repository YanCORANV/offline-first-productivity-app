import type { ScheduleBlock } from "@/lib/domain";
import { InspectorShell } from "../../composers";

export function TodayCompletionChoice({
  block,
  onClose,
  onComplete,
}: {
  block: ScheduleBlock | null;
  onClose: () => void;
  onComplete: (block: ScheduleBlock, scope: "block" | "item") => void;
}) {
  if (!block) return null;
  return (
    <InspectorShell title="完成到哪里？" onClose={onClose}>
      <div className="completion-choice">
        <p>这个事项还有其他时间块。默认只完成当前时间块。</p>
        <button className="primary-button" type="button" onClick={() => onComplete(block, "block")}>完成当前时间块</button>
        <button className="secondary-button" type="button" onClick={() => onComplete(block, "item")}>完成整个事项</button>
      </div>
    </InspectorShell>
  );
}
