import type { CSSProperties } from "react";
import { MORANDI_COLORS, type ItemTypeOption, type QuickThought } from "@/lib/domain";
import type { RepeatPreset } from "../composer-shared";

export function EventTitleSection({
  title,
  previewColor,
  typeName,
  onTitleChange,
}: {
  title: string;
  previewColor: string;
  typeName: string;
  onTitleChange: (value: string) => void;
}) {
  return (
    <div
      className="item-color-preview title-edit-preview"
      style={{ "--preview-color": previewColor } as CSSProperties}
    >
      <span className="item-preview-check" />
      <span>
        <input
          className="title-preview-input"
          autoFocus
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="需要完成什么？"
        />
        <small>{typeName}</small>
      </span>
    </div>
  );
}

export function EventTypeSection({
  itemTypes,
  selectedId,
  onSelect,
}: {
  itemTypes: ItemTypeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="item-type-section">
      <span className="field-label">类型</span>
      <div className="item-type-options">
        {itemTypes.map((type) => (
          <button
            key={type.id}
            className={selectedId === type.id ? "is-active" : ""}
            type="button"
            onClick={() => onSelect(type.id)}
          >
            <span style={{ backgroundColor: type.color }} />
            {type.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EventColorSection({
  colorOverride,
  onChange,
}: {
  colorOverride: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field item-color-field">
      <span>颜色</span>
      <div className="morandi-palette">
        <button
          type="button"
          className={!colorOverride ? "is-active default-color-button" : "default-color-button"}
          onClick={() => onChange("")}
        >
          类型默认
        </button>
        {MORANDI_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={colorOverride === color ? "is-active" : ""}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`选择颜色 ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

export function EventScheduleSection({
  startAt,
  endAt,
  repeat,
  recurrenceEndAt,
  onStartChange,
  onEndChange,
  onRepeatChange,
  onRecurrenceEndChange,
}: {
  startAt: string;
  endAt: string;
  repeat: RepeatPreset;
  recurrenceEndAt: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onRepeatChange: (value: RepeatPreset) => void;
  onRecurrenceEndChange: (value: string) => void;
}) {
  return (
    <div className="field-grid">
      <label className="field">
        <span>开始</span>
        <input type="datetime-local" value={startAt} onChange={(event) => onStartChange(event.target.value)} />
      </label>
      <label className="field">
        <span>结束</span>
        <input type="datetime-local" value={endAt} onChange={(event) => onEndChange(event.target.value)} />
      </label>
      <label className="field">
        <span>重复</span>
        <select value={repeat} onChange={(event) => onRepeatChange(event.target.value as RepeatPreset)}>
          <option value="none">不重复</option>
          <option value="daily">每天</option>
          <option value="weekdays">工作日</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
        </select>
      </label>
      {repeat !== "none" ? (
        <label className="field">
          <span>重复结束（可选）</span>
          <input type="date" value={recurrenceEndAt} onChange={(event) => onRecurrenceEndChange(event.target.value)} />
        </label>
      ) : null}
    </div>
  );
}

export function EventNotesSection({ notes, onChange }: { notes: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>备注</span>
      <textarea value={notes} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function EventOriginsSection({ origins }: { origins: QuickThought[] }) {
  if (!origins.length) return null;
  return (
    <details className="origin-details">
      <summary>来自 {origins.length} 条 Quick Thought</summary>
      {origins.map((thought) => <p key={thought.id}>{thought.content || "原想法已删除"}</p>)}
    </details>
  );
}
