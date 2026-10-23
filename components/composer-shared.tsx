"use client";

import "./composer-shared.css";

import { useState } from "react";
import { makeCustomRepeatRule, newId, type ReminderRule } from "@/lib/domain";

export type RepeatPreset = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";

export const reminderOptions = [
  { value: 0, label: "到点" },
  { value: 15, label: "提前 15 分钟" },
  { value: 30, label: "提前 30 分钟" },
  { value: 60, label: "提前 1 小时" },
  { value: 1440, label: "提前 1 天" },
];

export const reminderPresetValues = new Set(reminderOptions.map((option) => option.value));

export function ReminderPicker({
  values,
  onChange,
  hideLegend = false,
}: {
  values: number[];
  onChange: (value: number[]) => void;
  hideLegend?: boolean;
}) {
  const customOffset = values.find((value) => !reminderPresetValues.has(value));
  const customActive = customOffset != null;
  const [lastCustomOffset, setLastCustomOffset] = useState<number>(customOffset ?? 10);

  const activeCustomValue = customOffset ?? lastCustomOffset;
  const customUnit =
    activeCustomValue >= 1440 && activeCustomValue % 1440 === 0
      ? 1440
      : activeCustomValue >= 60 && activeCustomValue % 60 === 0
      ? 60
      : 1;
  const customAmount = Math.max(1, Math.round(activeCustomValue / customUnit));

  function handleToggleCustom(checked: boolean) {
    if (checked) {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      const presets = values.filter((value) => reminderPresetValues.has(value));
      onChange([...new Set([...presets, activeCustomValue])]);
    } else {
      onChange(values.filter((value) => reminderPresetValues.has(value)));
    }
  }

  function handleCustomChange(amount: number, unit: number) {
    const totalMinutes = Math.max(1, Math.round(amount * unit));
    setLastCustomOffset(totalMinutes);
    if (customActive) {
      const presets = values.filter((value) => reminderPresetValues.has(value));
      onChange([...new Set([...presets, totalMinutes])]);
    }
  }

  return (
    <fieldset className="reminder-picker">
      {!hideLegend ? <legend>提醒</legend> : null}
      <div className="reminder-options">
        {reminderOptions.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label key={option.value} className={`reminder-pill ${checked ? "is-checked" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  if (event.target.checked && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                    void Notification.requestPermission();
                  }
                  const next = event.target.checked
                    ? [...values, option.value]
                    : values.filter((value) => value !== option.value);
                  onChange([...new Set(next)]);
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
        <div className={`reminder-pill reminder-custom-pill ${customActive ? "is-checked" : ""}`}>
          <label className="reminder-custom-check-label">
            <input
              type="checkbox"
              checked={customActive}
              onChange={(e) => handleToggleCustom(e.target.checked)}
            />
            <span>自定义</span>
          </label>
          {customActive ? (
            <div className="reminder-custom-inline-controls">
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                aria-label="自定义提醒时长"
                onChange={(event) =>
                  handleCustomChange(Number(event.target.value) || 1, customUnit)
                }
              />
              <select
                value={customUnit}
                aria-label="自定义提醒单位"
                onChange={(event) =>
                  handleCustomChange(customAmount, Number(event.target.value))
                }
              >
                <option value="1">分钟</option>
                <option value="60">小时</option>
                <option value="1440">天</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}

export function makeRules(
  offsets: number[],
  anchor: ReminderRule["anchor"],
): ReminderRule[] {
  return offsets.map((offsetMinutes) => ({
    id: newId("reminder"),
    offsetMinutes,
    anchor,
  }));
}

export { makeCustomRepeatRule };
