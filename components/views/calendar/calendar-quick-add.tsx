"use client";

import { Check, X } from "lucide-react";
import { InspectorShell } from "../../composer-shell";
import { useCalendarQuickAdd, type CalendarQuickAddProps } from "./calendar-quick-add-controller";

export function CalendarQuickAdd(props: CalendarQuickAddProps) {
  const editor = useCalendarQuickAdd(props);
  const { rows, entries, saving, error } = editor;
  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(props.date);

  return (
    <InspectorShell
      title={`快速添加 · ${dateLabel}`}
      panelClassName="calendar-quick-add-inspector"
      onClose={editor.close}
    >
      <form
        className="calendar-quick-add-form"
        aria-busy={saving}
        onSubmit={(event) => {
          event.preventDefault();
          void editor.submit();
        }}
      >
        <ol className="calendar-quick-add-list" aria-label={`${dateLabel}事项清单`}>
          {rows.map((row, index) => (
            <li className={row.completed ? "calendar-quick-add-row is-completed" : "calendar-quick-add-row"} key={row.id}>
              <label className="calendar-quick-add-check">
                <span className="sr-only">第 {index + 1} 项已完成</span>
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={row.completed}
                  onChange={(event) => editor.updateRow(row.id, { completed: event.target.checked })}
                />
                <span className="calendar-quick-add-checkbox-visual" aria-hidden="true">
                  {row.completed ? <Check size={11} strokeWidth={2.5} /> : null}
                </span>
              </label>
              <textarea
                ref={(element) => {
                  if (element) editor.inputs.current.set(row.id, element);
                  else editor.inputs.current.delete(row.id);
                }}
                className="calendar-quick-add-title"
                rows={1}
                disabled={saving}
                value={row.title}
                placeholder="输入事项"
                aria-label={`第 ${index + 1} 项内容`}
                autoComplete="off"
                enterKeyHint="next"
                onChange={(event) => {
                  const title = event.target.value;
                  if (/[\r\n]/.test(title) && !(event.nativeEvent as InputEvent).isComposing) {
                    editor.insertText(row.id, 0, row.title.length, title);
                  } else {
                    editor.updateRow(row.id, { title });
                  }
                }}
                onPaste={(event) => {
                  const text = event.clipboardData.getData("text/plain");
                  if (!/[\r\n]/.test(text)) return;
                  event.preventDefault();
                  editor.insertText(row.id, event.currentTarget.selectionStart, event.currentTarget.selectionEnd, text);
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (event.ctrlKey || event.metaKey) void editor.submit();
                    else editor.insertText(row.id, event.currentTarget.selectionStart, event.currentTarget.selectionEnd, "\n");
                  } else if (event.key === "Backspace" && !row.title && rows.length > 1) {
                    event.preventDefault();
                    editor.removeRow(row.id);
                  }
                }}
              />
              <button
                type="button"
                disabled={saving}
                className="calendar-quick-add-remove"
                aria-label={`移除第 ${index + 1} 项`}
                onClick={() => editor.removeRow(row.id)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <div className="calendar-quick-add-footer">
          <div className="calendar-quick-add-actions">
            <button className="calendar-quick-add-cancel-btn" type="button" aria-label="暂存草稿并关闭" onClick={editor.close} disabled={saving}>暂存</button>
            <button className="calendar-quick-add-submit-btn" type="submit" disabled={!entries.length || saving}>
              {saving ? "正在添加…" : entries.length ? `添加 ${entries.length} 项` : "添加"}
            </button>
          </div>
        </div>
        <div className="calendar-quick-add-status">
          {error ? <span role="alert">{error}</span> : editor.removed ? (
            <span className="calendar-quick-add-undo" role="status">
              已移除一行
              <button className="text-button" type="button" disabled={saving} onClick={editor.undoRemove}>撤销</button>
            </span>
          ) : null}
        </div>
      </form>
    </InspectorShell>
  );
}
