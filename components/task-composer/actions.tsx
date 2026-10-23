import { useState } from "react";
import { Trash2 } from "lucide-react";

export function ComposerActions({
  saving,
  enabled,
  onClose,
  label,
  deleteLabel = "删除事项",
  onDelete,
  failLabel,
  onFail,
}: {
  saving?: boolean;
  enabled: boolean;
  onClose: () => void;
  label: string;
  deleteLabel?: string;
  onDelete?: () => Promise<void>;
  failLabel?: string;
  onFail?: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [failing, setFailing] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    if (!onDelete || deleting || failing) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError("删除失败，请稍后重试。");
      setDeleting(false);
    }
  }

  async function handleFail() {
    if (!onFail || deleting || failing) return;
    setFailing(true);
    setDeleteError("");
    try {
      await onFail();
    } catch {
      setDeleteError("更新状态失败，请稍后重试。");
      setFailing(false);
    }
  }

  return (
    <div className="composer-action-area">
      {deleteError ? <small className="composer-delete-error" role="alert">{deleteError}</small> : null}
      <div className="composer-actions">
        {onDelete ? (
          <button className="danger-action" type="button" disabled={deleting || failing || saving} onClick={() => void handleDelete()}>
            <Trash2 size={15} aria-hidden="true" />
            <span>{deleting ? "删除中" : deleteLabel === "删除" ? "删除事项" : deleteLabel}</span>
          </button>
        ) : null}
        {onFail ? (
          <button className="secondary-button" type="button" disabled={deleting || failing || saving} onClick={() => void handleFail()}>
            {failing ? "处理中" : failLabel ?? "标记为失败"}
          </button>
        ) : null}
        <div className="composer-primary-actions">
          <button className="secondary-button" type="button" onClick={onClose}>取消</button>
          <button className="primary-button" type="submit" disabled={!enabled || saving || deleting || failing}>
            {saving ? "保存中" : label}
          </button>
        </div>
      </div>
    </div>
  );
}
