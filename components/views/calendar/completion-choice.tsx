import { InspectorShell } from "../../composers";

export function CompletionChoice({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (scope: "block" | "item") => Promise<void>;
}) {
  return (
    <InspectorShell title="完成到哪里？" onClose={onClose}>
      <div className="completion-choice">
        <p>这个事项还有其他时间块。默认只完成当前这一次安排。</p>
        <button className="primary-button" type="button" onClick={() => void onComplete("block")}>
          完成当前时间块
        </button>
        <button className="secondary-button" type="button" onClick={() => void onComplete("item")}>
          完成整个事项
        </button>
      </div>
    </InspectorShell>
  );
}
