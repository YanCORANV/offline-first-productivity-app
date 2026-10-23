import type { ReactNode } from "react";
import { FileText, X } from "lucide-react";

export function TaskTitleSection({
  title,
  isCourse = false,
  isDeadline = false,
  showError,
  autoFocus = false,
  onTitleChange,
  children,
  failAction,
}: {
  title: string;
  isCourse?: boolean;
  isDeadline?: boolean;
  showError: boolean;
  autoFocus?: boolean;
  onTitleChange: (value: string) => void;
  children?: ReactNode;
  failAction?: ReactNode;
}) {
  return (
    <section className="task-title-section" aria-label={isCourse ? "课程名称" : "事项名称"}>
      <label htmlFor="task-title-input" className="apple-field-label">
        <span>{isCourse ? "课程名称" : "事项标题"}</span>
        {!isDeadline ? <span className="apple-required-star" aria-hidden="true">*</span> : null}
      </label>
      <div className={`task-title-row ${showError ? "has-error" : ""}`}>
        <div className="task-title-field">
          <div className="task-title-input-wrapper">
            <FileText size={18} className="task-title-icon" aria-hidden="true" />
            <input
              id="task-title-input"
              autoFocus={autoFocus}
              value={title}
              aria-invalid={showError}
              aria-describedby={showError ? "task-title-error" : undefined}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={isCourse ? "请输入课程名称，例如：ECE 470 机器人学" : "请输入事项标题，例如：复习 ECE330..."}
            />
            {title ? (
              <button
                type="button"
                className="task-title-clear-btn"
                aria-label="清空标题"
                onClick={() => onTitleChange("")}
              >
                <X size={13} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {showError ? <small id="task-title-error">请输入{isCourse ? "课程" : "事项"}名称</small> : null}
        </div>
        {children || failAction ? (
          <div className="task-status-actions-row">
            {children}
            {failAction}
          </div>
        ) : null}
      </div>
    </section>
  );
}
