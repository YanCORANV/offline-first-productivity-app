import { useState, type CSSProperties } from "react";
import { Bell, Check, ChevronDown, ChevronRight, Flag, Plus, Repeat, Tag, Trash2, X } from "lucide-react";
import { DEFAULT_ITEM_TYPES, courseWeekdayForDate, localDateKey, type AssignmentStatus, type ItemTypeOption, type QuickThought } from "@/lib/domain";
import type { RepeatPreset } from "../../composer-shared";
import { ReminderPicker, reminderOptions } from "../../composer-shared";
import { ProjectColorPicker } from "../../views/projects/project-color-picker";
import { formatScheduleDate } from "./schedule-section";
import { TaskNotesSection } from "./notes-section";

type TimePreference = "none" | "continuous" | "fragment";
type RepeatUnit = "daily" | "weekly" | "monthly";

export interface TaskOrganizationSectionProps {
  itemTypes: ItemTypeOption[];
  editingTask: boolean;
  itemTypeId: string;
  newTypeName: string;
  newTypeColor: string;
  showTypeCreator: boolean;
  isCourse: boolean;
  isDeadline?: boolean;
  date?: string;
  hasTime?: boolean;
  isAllDay?: boolean;
  timePreference?: TimePreference;
  assignmentStatus?: AssignmentStatus;
  repeat?: RepeatPreset;
  repeatInterval?: string;
  repeatUnit?: RepeatUnit;
  repeatWeekdays?: number[];
  recurrenceEndAt?: string;
  repeatSummary?: string;
  reminders?: number[];
  notes?: string;
  origins?: QuickThought[];
  onItemTypeChange: (value: string) => void;
  onNewTypeNameChange: (value: string) => void;
  onNewTypeColorChange: (value: string) => void;
  onShowTypeCreatorChange: (value: boolean) => void;
  onRemoveCustomType: (typeId: string) => Promise<void>;
  onCreateCustomType: () => Promise<void>;
  onCourseSelected: () => void;
  onTimePreferenceChange?: (value: TimePreference) => void;
  onAssignmentStatusChange?: (status: AssignmentStatus) => void;
  onRepeatChange?: (preset: RepeatPreset) => void;
  onRepeatIntervalChange?: (value: string) => void;
  onRepeatUnitChange?: (value: RepeatUnit) => void;
  onRepeatWeekdaysChange?: (weekdays: number[]) => void;
  onRecurrenceEndAtChange?: (value: string) => void;
  onRemindersChange: (values: number[]) => void;
  onNotesChange?: (value: string) => void;
  onDirty: () => void;
  isMobile?: boolean;
}

function TaskOrganizationSectionDesktop({
  itemTypes,
  editingTask,
  itemTypeId,
  newTypeName,
  newTypeColor,
  showTypeCreator,
  isCourse,
  isDeadline = false,
  date = "",
  assignmentStatus = "todo",
  repeat = "none",
  repeatInterval = "1",
  repeatUnit = "daily",
  repeatWeekdays = [],
  recurrenceEndAt = "",
  repeatSummary = "",
  reminders = [],
  notes = "",
  origins,
  onItemTypeChange,
  onNewTypeNameChange,
  onNewTypeColorChange,
  onShowTypeCreatorChange,
  onRemoveCustomType,
  onCreateCustomType,
  onCourseSelected,
  onAssignmentStatusChange,
  onRepeatChange,
  onRepeatIntervalChange,
  onRepeatUnitChange,
  onRepeatWeekdaysChange,
  onRecurrenceEndAtChange,
  onRemindersChange,
  onNotesChange,
  onDirty,
}: {
  itemTypes: ItemTypeOption[];
  editingTask: boolean;
  itemTypeId: string;
  newTypeName: string;
  newTypeColor: string;
  showTypeCreator: boolean;
  isCourse: boolean;
  isDeadline?: boolean;
  date?: string;
  hasTime?: boolean;
  isAllDay?: boolean;
  timePreference?: TimePreference;
  assignmentStatus?: AssignmentStatus;
  repeat?: RepeatPreset;
  repeatInterval?: string;
  repeatUnit?: RepeatUnit;
  repeatWeekdays?: number[];
  recurrenceEndAt?: string;
  repeatSummary?: string;
  reminders?: number[];
  notes?: string;
  origins?: QuickThought[];
  onItemTypeChange: (value: string) => void;
  onNewTypeNameChange: (value: string) => void;
  onNewTypeColorChange: (value: string) => void;
  onShowTypeCreatorChange: (value: boolean) => void;
  onRemoveCustomType: (typeId: string) => Promise<void>;
  onCreateCustomType: () => Promise<void>;
  onCourseSelected: () => void;
  onTimePreferenceChange?: (value: TimePreference) => void;
  onAssignmentStatusChange?: (status: AssignmentStatus) => void;
  onRepeatChange?: (preset: RepeatPreset) => void;
  onRepeatIntervalChange?: (value: string) => void;
  onRepeatUnitChange?: (value: RepeatUnit) => void;
  onRepeatWeekdaysChange?: (weekdays: number[]) => void;
  onRecurrenceEndAtChange?: (value: string) => void;
  onRemindersChange: (values: number[]) => void;
  onNotesChange?: (value: string) => void;
  onDirty: () => void;
}) {
  const visibleTypes = itemTypes.filter((type) => type.id !== "course" || !editingTask);

  return (
    <section className="task-editor-section task-organization-column" aria-label="分类与设置">
      {/* Category Row */}
      <div className="apple-attribute-row is-category-row">
        <div className="apple-attr-label-cell">
          <Tag size={15} aria-hidden="true" className="apple-attr-icon" />
          <span>分类</span>
        </div>
        <div className="apple-attr-control-cell apple-category-chips-cell">
          <div className="item-type-options apple-category-options">
            {visibleTypes.map((type) => {
              const active = itemTypeId === type.id;
              return (
                <div
                  key={type.id}
                  className={`item-type-option apple-cat-chip ${active ? "is-active" : ""}`}
                  style={{ "--item-type-color": type.color } as CSSProperties}
                >
                  <button
                    className="item-type-select apple-cat-btn"
                    type="button"
                    onClick={() => {
                      onDirty();
                      onItemTypeChange(type.id);
                      if (type.id === "course") onCourseSelected();
                    }}
                  >
                    <span className="apple-cat-dot" style={{ backgroundColor: type.color }} aria-hidden="true" />
                    <span className="item-type-name">{type.name}</span>
                  </button>
                  {!DEFAULT_ITEM_TYPES.some((item) => item.id === type.id) ? (
                    <button
                      type="button"
                      className="item-type-delete-wrap apple-cat-delete"
                      aria-label={`删除类型 ${type.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onRemoveCustomType(type.id);
                      }}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              className="new-type-trigger apple-new-cat-btn"
              type="button"
              onClick={() => {
                onNewTypeColorChange("#D7A6A1");
                onShowTypeCreatorChange(true);
              }}
            >
              <Plus size={13} aria-hidden="true" /> 新建分类
            </button>
          </div>
        </div>
      </div>

      {showTypeCreator ? (
        <div
          className="type-create-panel"
          role="region"
          aria-label="新建分类"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onShowTypeCreatorChange(false);
            }
          }}
        >
          <div className="type-create-header">
            <span className="type-create-title">新建分类</span>
            <div
              className="type-create-preview-badge"
              style={{ "--item-type-color": newTypeColor } as CSSProperties}
            >
              <span className="apple-cat-dot" style={{ backgroundColor: newTypeColor }} aria-hidden="true" />
              <span className="type-create-preview-text">{newTypeName.trim() || "分类名称"}</span>
            </div>
          </div>

          <div className="type-create-field">
            <label htmlFor="desktop-new-type-name" className="type-create-field-label">
              分类名称
            </label>
            <input
              id="desktop-new-type-name"
              autoFocus
              className="type-create-name-input"
              value={newTypeName}
              placeholder="例如：阅读、健身"
              onChange={(event) => onNewTypeNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && newTypeName.trim()) {
                  event.preventDefault();
                  void onCreateCustomType();
                }
              }}
            />
          </div>

          <div className="type-create-field">
            <span className="type-create-field-label">分类颜色</span>
            <ProjectColorPicker
              color={newTypeColor}
              onChange={(color) => {
                onDirty();
                onNewTypeColorChange(color);
              }}
            />
          </div>

          <div className="type-create-actions">
            <button
              type="button"
              className="type-create-btn type-create-cancel-btn"
              onClick={() => onShowTypeCreatorChange(false)}
            >
              取消
            </button>
            <button
              className="type-create-btn type-create-submit-btn"
              type="button"
              disabled={!newTypeName.trim()}
              onClick={() => void onCreateCustomType()}
            >
              创建
            </button>
          </div>
        </div>
      ) : null}

      {/* Deadline Status Row */}
      {isDeadline && onAssignmentStatusChange ? (
        <div className="apple-attribute-row is-status-row">
          <div className="apple-attr-label-cell">
            <Flag size={15} aria-hidden="true" className="apple-attr-icon" />
            <span>状态</span>
          </div>
          <div className="apple-attr-control-cell">
            <div className="apple-deadline-status-pills" role="group" aria-label="作业状态">
              {([
                ["todo", "待完成"],
                ["content_done", "内容已完成"],
                ["submitted", "已提交"],
              ] as const).map(([status, label]) => {
                const active = assignmentStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={`apple-deadline-pill ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => {
                      onDirty();
                      onAssignmentStatusChange(status);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Reminder Row */}
      <div className="apple-attribute-row is-reminder-row">
        <div className="apple-attr-label-cell">
          <Bell size={15} aria-hidden="true" className="apple-attr-icon" />
          <span>提醒</span>
        </div>
        <div className="apple-attr-control-cell apple-reminder-chips-cell">
          <ReminderPicker values={reminders} onChange={onRemindersChange} hideLegend />
        </div>
      </div>

      {/* Repeat Row (Hidden for Course) */}
      {!isCourse && onRepeatChange ? (
        <div className="apple-attribute-row is-repeat-row mac-attribute-row">
          <div className="apple-attr-label-cell">
            <Repeat size={15} aria-hidden="true" className="apple-attr-icon" />
            <span>重复</span>
          </div>
          <div className="apple-attr-control-cell apple-repeat-desktop-cell">
            <div className="field task-repeat-field">
              <div className="mac-repeat-control-cell">
            {/* macOS Native Pop-up Select Button */}
            <div className="mac-popup-wrapper">
              <select
                className="mac-popup-select"
                value={repeat}
                aria-label="重复频率"
                onChange={(event) => {
                  onDirty();
                  const nextPreset = event.target.value as RepeatPreset;
                  onRepeatChange(nextPreset);
                  if (nextPreset === "weekly" && !repeatWeekdays.length && date && onRepeatWeekdaysChange) {
                    onRepeatWeekdaysChange([courseWeekdayForDate(date)]);
                  }
                }}
              >
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekdays">工作日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="custom">自定义...</option>
              </select>
            </div>

            {/* Custom repeat frequency inline */}
            {repeat === "custom" && onRepeatIntervalChange && onRepeatUnitChange ? (
              <div className="mac-custom-repeat-inline">
                <span className="mac-inline-label">每</span>
                <input
                  type="number"
                  min="1"
                  value={repeatInterval}
                  onChange={(event) => {
                    onDirty();
                    onRepeatIntervalChange(event.target.value);
                  }}
                  className="mac-number-input"
                />
                <div className="mac-popup-wrapper">
                  <select
                    value={repeatUnit}
                    onChange={(event) => {
                      onDirty();
                      onRepeatUnitChange(event.target.value as RepeatUnit);
                    }}
                    className="mac-popup-select mac-unit-select"
                  >
                    <option value="daily">天</option>
                    <option value="weekly">周</option>
                    <option value="monthly">月</option>
                  </select>
                </div>
                <span className="mac-inline-label">重复一次</span>
              </div>
            ) : null}

            {/* Weekly or Custom-weekly weekdays: macOS segmented control */}
            {(repeat === "weekly" || (repeat === "custom" && repeatUnit === "weekly")) && onRepeatWeekdaysChange ? (
              <div className="mac-segmented-control" role="group" aria-label="重复星期">
                {["一", "二", "三", "四", "五", "六", "日"].map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    className={`mac-segment-btn ${repeatWeekdays.includes(index) ? "is-active" : ""}`}
                    onClick={() => {
                      onDirty();
                      onRepeatWeekdaysChange(
                        repeatWeekdays.includes(index)
                          ? repeatWeekdays.filter((day) => day !== index)
                          : [...repeatWeekdays, index],
                      );
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Recurrence End Date: inline in the same row */}
            {repeat !== "none" && onRecurrenceEndAtChange ? (
              <div className="mac-repeat-inline-group">
                <span className="mac-inline-label">结束于</span>
                <div className="mac-segmented-control" role="group" aria-label="结束重复方式">
                  <button
                    type="button"
                    className={`mac-segment-btn mac-segment-text-btn ${!recurrenceEndAt ? "is-active" : ""}`}
                    onClick={() => {
                      onDirty();
                      onRecurrenceEndAtChange("");
                    }}
                  >
                    永不
                  </button>
                  <button
                    type="button"
                    className={`mac-segment-btn mac-segment-text-btn ${recurrenceEndAt ? "is-active" : ""}`}
                    onClick={() => {
                      if (!recurrenceEndAt) {
                        onDirty();
                        const base = new Date();
                        base.setMonth(base.getMonth() + 1);
                        onRecurrenceEndAtChange(localDateKey(base));
                      }
                    }}
                  >
                    指定日期
                  </button>
                </div>
                {recurrenceEndAt ? (
                  <div className="mac-date-picker-wrapper">
                    <input
                      type="date"
                      value={recurrenceEndAt}
                      aria-label="结束日期"
                      onChange={(event) => {
                        onDirty();
                        onRecurrenceEndAtChange(event.target.value);
                      }}
                      className="mac-date-input"
                    />
                    <button
                      type="button"
                      className="mac-clear-btn"
                      title="清除结束日期（设为永不）"
                      aria-label="清除结束日期"
                      onClick={() => {
                        onDirty();
                        onRecurrenceEndAtChange("");
                      }}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Subtle summary if custom */}
            {repeat === "custom" && repeatSummary ? (
              <span className="mac-repeat-summary">{repeatSummary}</span>
            ) : null}

            {repeat === "custom" ? <div className="task-repeat-details" style={{ display: "none" }} /> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Time preference removed per user request: !isCourse && !isAllDay && !hasTime */}

      {/* Notes Section */}
      {!isCourse && onNotesChange ? (
        <TaskNotesSection notes={notes} origins={origins} onNotesChange={onNotesChange} />
      ) : null}
    </section>
  );
}

function TaskOrganizationSectionMobile({
  itemTypes,
  editingTask,
  itemTypeId,
  newTypeName,
  newTypeColor,
  showTypeCreator,
  isCourse,
  isDeadline = false,
  date = "",
  assignmentStatus = "todo",
  repeat = "none",
  repeatInterval = "1",
  repeatUnit = "daily",
  repeatWeekdays = [],
  recurrenceEndAt = "",
  repeatSummary = "",
  reminders = [],
  notes = "",
  origins,
  onItemTypeChange,
  onNewTypeNameChange,
  onNewTypeColorChange,
  onShowTypeCreatorChange,
  onRemoveCustomType,
  onCreateCustomType,
  onCourseSelected,
  onAssignmentStatusChange,
  onRepeatChange,
  onRepeatIntervalChange,
  onRepeatUnitChange,
  onRepeatWeekdaysChange,
  onRecurrenceEndAtChange,
  onRemindersChange,
  onNotesChange,
  onDirty,
}: {
  itemTypes: ItemTypeOption[];
  editingTask: boolean;
  itemTypeId: string;
  newTypeName: string;
  newTypeColor: string;
  showTypeCreator: boolean;
  isCourse: boolean;
  isDeadline?: boolean;
  date?: string;
  assignmentStatus?: AssignmentStatus;
  repeat?: RepeatPreset;
  repeatInterval?: string;
  repeatUnit?: RepeatUnit;
  repeatWeekdays?: number[];
  recurrenceEndAt?: string;
  repeatSummary?: string;
  reminders?: number[];
  notes?: string;
  origins?: QuickThought[];
  onItemTypeChange: (value: string) => void;
  onNewTypeNameChange: (value: string) => void;
  onNewTypeColorChange: (value: string) => void;
  onShowTypeCreatorChange: (value: boolean) => void;
  onRemoveCustomType: (typeId: string) => Promise<void>;
  onCreateCustomType: () => Promise<void>;
  onCourseSelected: () => void;
  onAssignmentStatusChange?: (status: AssignmentStatus) => void;
  onRepeatChange?: (preset: RepeatPreset) => void;
  onRepeatIntervalChange?: (value: string) => void;
  onRepeatUnitChange?: (value: RepeatUnit) => void;
  onRepeatWeekdaysChange?: (weekdays: number[]) => void;
  onRecurrenceEndAtChange?: (value: string) => void;
  onRemindersChange: (values: number[]) => void;
  onNotesChange?: (value: string) => void;
  onDirty: () => void;
}) {
  const [categoryExpanded, setCategoryExpanded] = useState(!isCourse);
  const [expandedSection, setExpandedSection] = useState<"repeat" | "reminder" | null>(null);

  const visibleTypes = itemTypes.filter((type) => type.id !== "course" || !editingTask);
  const selectedType = itemTypes.find((type) => type.id === itemTypeId) ?? itemTypes[0];

  function toggleCategory() {
    if (isCourse) return;
    setCategoryExpanded((current) => !current);
  }

  function toggleSection(section: "repeat" | "reminder") {
    setExpandedSection((current) => (current === section ? null : section));
  }

  const reminderLabel = (() => {
    if (!reminders || reminders.length === 0) return "不提醒";
    const labels = reminders.map((val) => {
      const preset = reminderOptions.find((p) => p.value === val);
      if (preset) return preset.label;
      if (val >= 1440 && val % 1440 === 0) return `提前 ${val / 1440} 天`;
      if (val >= 60 && val % 60 === 0) return `提前 ${val / 60} 小时`;
      return `提前 ${val} 分钟`;
    });
    return labels.join("、");
  })();

  const repeatPresetLabel =
    repeat === "none"
      ? "不重复"
      : repeat === "daily"
      ? "每天"
      : repeat === "weekdays"
      ? "工作日"
      : repeat === "weekly"
      ? "每周"
      : repeat === "monthly"
      ? "每月"
      : "自定义";

  return (
    <section className="task-editor-section task-organization-column" aria-label="其他设置">
      <div className="apple-settings-card">

        {/* Category Row */}
        <div
          className={`apple-settings-row ${isCourse ? "is-locked" : ""} ${categoryExpanded ? "is-expanded" : ""}`}
          onClick={isCourse ? undefined : toggleCategory}
          role={isCourse ? undefined : "button"}
          tabIndex={isCourse ? undefined : 0}
          aria-expanded={isCourse ? undefined : categoryExpanded}
          aria-label="分类设置"
          onKeyDown={
            isCourse
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory();
                  }
                }
          }
        >
          <div className="apple-settings-row-label">
            <Tag size={16} aria-hidden="true" className="apple-field-icon" />
            <span>分类</span>
          </div>
          <div className="apple-settings-row-value">
            <span className="apple-cat-dot" style={{ backgroundColor: selectedType?.color }} aria-hidden="true" />
            <span className="apple-settings-val-text">{selectedType?.name}</span>
            {!isCourse ? (
              categoryExpanded ? (
                <ChevronDown size={14} className="apple-settings-chevron" aria-hidden="true" />
              ) : (
                <ChevronRight size={14} className="apple-settings-chevron" aria-hidden="true" />
              )
            ) : null}
          </div>
        </div>

        {/* Category Picker Accordion */}
        {!isCourse && categoryExpanded ? (
          <div className="apple-settings-accordion-content" onClick={(e) => e.stopPropagation()}>
            <div className="item-type-options apple-category-options">
              {visibleTypes.map((type) => {
                const active = itemTypeId === type.id;
                return (
                  <div
                    key={type.id}
                    className={`item-type-option apple-cat-chip ${active ? "is-active" : ""}`}
                    style={{ "--item-type-color": type.color } as CSSProperties}
                  >
                    <button
                      className="item-type-select apple-cat-btn"
                      type="button"
                      onClick={() => {
                        onDirty();
                        onItemTypeChange(type.id);
                        if (type.id === "course") onCourseSelected();
                      }}
                    >
                      <span className="apple-cat-dot" style={{ backgroundColor: type.color }} aria-hidden="true" />
                      <span className="item-type-name">{type.name}</span>
                      {active ? <Check size={12} className="cat-check-icon" aria-hidden="true" /> : null}
                    </button>
                    {!DEFAULT_ITEM_TYPES.some((item) => item.id === type.id) ? (
                      <button
                        type="button"
                        className="item-type-delete-wrap apple-cat-delete"
                        aria-label={`删除类型 ${type.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void onRemoveCustomType(type.id);
                        }}
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <button
                className="new-type-trigger apple-new-cat-btn"
                type="button"
                onClick={() => {
                  onNewTypeColorChange("#D7A6A1");
                  onShowTypeCreatorChange(true);
                }}
              >
                <Plus size={13} aria-hidden="true" /> 新建分类
              </button>
            </div>

            {showTypeCreator ? (
              <div
                className="type-create-panel"
                role="region"
                aria-label="新建分类"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    onShowTypeCreatorChange(false);
                  }
                }}
              >
                <div className="type-create-header">
                  <span className="type-create-title">新建分类</span>
                  <div
                    className="type-create-preview-badge"
                    style={{ "--item-type-color": newTypeColor } as CSSProperties}
                  >
                    <span className="apple-cat-dot" style={{ backgroundColor: newTypeColor }} aria-hidden="true" />
                    <span className="type-create-preview-text">{newTypeName.trim() || "分类名称"}</span>
                  </div>
                </div>

                <div className="type-create-field">
                  <label htmlFor="mobile-new-type-name" className="type-create-field-label">
                    分类名称
                  </label>
                  <input
                    id="mobile-new-type-name"
                    autoFocus
                    className="type-create-name-input"
                    value={newTypeName}
                    placeholder="例如：阅读、健身"
                    onChange={(event) => onNewTypeNameChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && newTypeName.trim()) {
                        event.preventDefault();
                        void onCreateCustomType();
                      }
                    }}
                  />
                </div>

                <div className="type-create-field">
                  <span className="type-create-field-label">分类颜色</span>
                  <ProjectColorPicker
                    color={newTypeColor}
                    onChange={(color) => {
                      onDirty();
                      onNewTypeColorChange(color);
                    }}
                  />
                </div>

                <div className="type-create-actions">
                  <button
                    type="button"
                    className="type-create-btn type-create-cancel-btn"
                    onClick={() => onShowTypeCreatorChange(false)}
                  >
                    取消
                  </button>
                  <button
                    className="type-create-btn type-create-submit-btn"
                    type="button"
                    disabled={!newTypeName.trim()}
                    onClick={() => void onCreateCustomType()}
                  >
                    创建
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Deadline Status Row (if isDeadline) */}
        {isDeadline && onAssignmentStatusChange ? (
          <div className="apple-settings-row is-secondary-row is-deadline-status-row">
            <div className="apple-settings-row-label">
              <Flag size={16} aria-hidden="true" className="apple-field-icon" />
              <span>状态</span>
            </div>
            <div className="apple-deadline-status-pills" role="group" aria-label="作业状态">
              {([
                ["todo", "待完成"],
                ["content_done", "内容已完成"],
                ["submitted", "已提交"],
              ] as const).map(([status, label]) => {
                const active = assignmentStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={`apple-deadline-pill ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => {
                      onDirty();
                      onAssignmentStatusChange(status);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Reminder Row */}
        <div
          className={`apple-settings-row is-secondary-row ${expandedSection === "reminder" ? "is-expanded" : ""}`}
          onClick={() => toggleSection("reminder")}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSection === "reminder"}
          aria-label="提醒设置"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection("reminder");
            }
          }}
        >
          <div className="apple-settings-row-label">
            <Bell size={16} aria-hidden="true" className="apple-field-icon" />
            <span>提醒</span>
          </div>
          <div className="apple-settings-row-value">
            <span className="apple-settings-val-text">{reminderLabel}</span>
            {expandedSection === "reminder" ? (
              <ChevronDown size={14} className="apple-settings-chevron" aria-hidden="true" />
            ) : (
              <ChevronRight size={14} className="apple-settings-chevron" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Reminder Picker Accordion */}
        {expandedSection === "reminder" ? (
          <div className="apple-settings-accordion-content" onClick={(e) => e.stopPropagation()}>
            <ReminderPicker values={reminders} onChange={onRemindersChange} hideLegend />
          </div>
        ) : null}

        {/* Repeat Row (Hidden for Course) */}
        {!isCourse && onRepeatChange ? (
          <>
            <div
              className={`apple-settings-row is-secondary-row ${expandedSection === "repeat" ? "is-expanded" : ""}`}
              onClick={() => toggleSection("repeat")}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSection === "repeat"}
              aria-label="重复设置"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSection("repeat");
                }
              }}
            >
              <div className="apple-settings-row-label">
                <Repeat size={16} aria-hidden="true" className="apple-field-icon" />
                <span>重复</span>
              </div>
              <div className="apple-settings-row-value">
                <span className="apple-settings-val-text">{repeatSummary || repeatPresetLabel}</span>
                {expandedSection === "repeat" ? (
                  <ChevronDown size={14} className="apple-settings-chevron" aria-hidden="true" />
                ) : (
                  <ChevronRight size={14} className="apple-settings-chevron" aria-hidden="true" />
                )}
              </div>
            </div>

            {expandedSection === "repeat" ? (
              <div className="apple-settings-accordion-content" onClick={(e) => e.stopPropagation()}>
                <div className="field task-repeat-field apple-repeat-pills-container">
                  <div className="apple-repeat-pills-grid" role="group" aria-label="重复频率">
                    {[
                      { key: "none", label: "不重复" },
                      { key: "daily", label: "每天" },
                      { key: "weekdays", label: "工作日" },
                      { key: "weekly", label: "每周" },
                      { key: "monthly", label: "每月" },
                      { key: "custom", label: "自定义" },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={`apple-repeat-pill ${repeat === preset.key ? "is-active" : ""}`}
                        onClick={() => {
                          onDirty();
                          onRepeatChange(preset.key as RepeatPreset);
                          if (preset.key === "weekly" && !repeatWeekdays.length && date && onRepeatWeekdaysChange) {
                            onRepeatWeekdaysChange([courseWeekdayForDate(date)]);
                          }
                        }}
                      >
                        <span>{preset.label}</span>
                        {repeat === preset.key ? <Check size={12} className="repeat-check-icon" aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                </div>

                {repeat === "weekly" || repeat === "custom" || Boolean(recurrenceEndAt) ? (
                  <div className="task-repeat-details">
                    {repeat === "custom" && onRepeatIntervalChange && onRepeatUnitChange ? (
                      <div className="apple-repeat-custom-row">
                        <span className="apple-repeat-custom-label">频率</span>
                        <div className="apple-repeat-custom-controls">
                          <span>每</span>
                          <input
                            type="number"
                            min="1"
                            value={repeatInterval}
                            onChange={(event) => {
                              onDirty();
                              onRepeatIntervalChange(event.target.value);
                            }}
                            className="apple-repeat-interval-input"
                          />
                          <select
                            value={repeatUnit}
                            onChange={(event) => {
                              onDirty();
                              onRepeatUnitChange(event.target.value as RepeatUnit);
                            }}
                            className="apple-repeat-unit-select"
                          >
                            <option value="daily">天</option>
                            <option value="weekly">周</option>
                            <option value="monthly">月</option>
                          </select>
                          <span>重复一次</span>
                        </div>
                      </div>
                    ) : null}

                    {(repeat === "weekly" || (repeat === "custom" && repeatUnit === "weekly")) && onRepeatWeekdaysChange ? (
                      <div className="repeat-weekdays apple-repeat-weekdays-row">
                        {["一", "二", "三", "四", "五", "六", "日"].map((label, index) => (
                          <button
                            type="button"
                            key={label}
                            className={repeatWeekdays.includes(index) ? "is-active" : ""}
                            onClick={() => {
                              onDirty();
                              onRepeatWeekdaysChange(
                                repeatWeekdays.includes(index)
                                  ? repeatWeekdays.filter((day) => day !== index)
                                  : [...repeatWeekdays, index],
                              );
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {onRecurrenceEndAtChange ? (
                      <div className="apple-repeat-end-row">
                        <span className="apple-repeat-end-label">结束重复</span>
                        <div className="apple-repeat-end-value">
                          <span className={`apple-repeat-end-text ${!recurrenceEndAt ? "is-placeholder" : ""}`}>
                            {recurrenceEndAt ? formatScheduleDate(recurrenceEndAt) : "永不"}
                          </span>
                          {recurrenceEndAt ? (
                            <button
                              type="button"
                              className="mobile-clear-desired-btn"
                              title="清除结束日期"
                              aria-label="清除结束日期"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDirty();
                                onRecurrenceEndAtChange("");
                              }}
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          ) : null}
                          <ChevronRight size={14} className="apple-settings-chevron" aria-hidden="true" />
                          <input
                            type="date"
                            value={recurrenceEndAt}
                            onChange={(event) => {
                              onDirty();
                              onRecurrenceEndAtChange(event.target.value);
                            }}
                            className="task-date-native-input"
                          />
                        </div>
                      </div>
                    ) : null}

                    {repeatSummary ? <div className="repeat-summary apple-repeat-summary">{repeatSummary}</div> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Notes Section */}
      {!isCourse && onNotesChange ? (
        <TaskNotesSection notes={notes} origins={origins} onNotesChange={onNotesChange} />
      ) : null}
    </section>
  );
}


export function TaskOrganizationSection(props: TaskOrganizationSectionProps) {
  if (props.isMobile) {
    return <TaskOrganizationSectionMobile {...props} />;
  }
  return (
    <TaskOrganizationSectionDesktop
      {...props}
      hasTime={props.hasTime ?? false}
      isAllDay={props.isAllDay ?? false}
      timePreference={props.timePreference ?? "none"}
      onTimePreferenceChange={props.onTimePreferenceChange ?? (() => {})}
      reminders={props.reminders ?? []}
    />
  );
}
