"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { MORANDI_COLORS, type Goal, type QuickThought } from "@/lib/domain";

export type InboxProjectInput = {
  goalId: string | null;
  goalName: string;
  goalColor: string;
  projectTitle: string;
};

export function InboxProjectPanel({
  thought,
  goals,
  busy,
  onClose,
  onConfirm,
}: {
  thought: QuickThought;
  goals: Goal[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (input: InboxProjectInput) => void;
}) {
  const visibleGoals = useMemo(() => goals.filter((goal) => !goal.archived), [goals]);
  const [projectTitle, setProjectTitle] = useState(thought.content);
  const [goalName, setGoalName] = useState(visibleGoals[0]?.name ?? "");
  const [goalColor, setGoalColor] = useState(visibleGoals[0]?.color ?? MORANDI_COLORS[0]);
  const [goalMenuOpen, setGoalMenuOpen] = useState(false);
  const goalPickerRef = useRef<HTMLDivElement>(null);
  const selectedGoal = visibleGoals.find((goal) => normalizeName(goal.name) === normalizeName(goalName)) ?? null;

  useEffect(() => {
    if (!goalMenuOpen) return;
    function closeGoalMenu(event: PointerEvent) {
      if (!goalPickerRef.current?.contains(event.target as Node)) setGoalMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeGoalMenu);
    return () => document.removeEventListener("pointerdown", closeGoalMenu);
  }, [goalMenuOpen]);

  function changeGoalName(value: string) {
    setGoalName(value);
    setGoalMenuOpen(true);
    const existingGoal = visibleGoals.find((goal) => normalizeName(goal.name) === normalizeName(value));
    if (existingGoal?.color) setGoalColor(existingGoal.color);
  }

  function selectGoal(goal: Goal) {
    setGoalName(goal.name);
    setGoalColor(goal.color);
    setGoalMenuOpen(false);
  }

  return (
    <div className="inbox-project-panel">
      <header className="inbox-project-header">
        <h3>开始 Project</h3>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭 Project 设置">
          <X size={15} />
        </button>
      </header>
      <div className="inbox-project-fields">
        <label className="field">
          <span>Project 名称</span>
          <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
        </label>
        <div className="field inbox-goal-field">
          <span>Goal</span>
          <div className="inbox-goal-picker" ref={goalPickerRef}>
            <div
              className={goalMenuOpen ? "inbox-goal-input is-open" : "inbox-goal-input"}
              style={{ backgroundColor: goalColor }}
            >
              <input
                value={goalName}
                onChange={(event) => changeGoalName(event.target.value)}
                onFocus={() => setGoalMenuOpen(true)}
                onClick={() => setGoalMenuOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setGoalMenuOpen(false);
                  if (event.key === "ArrowDown") setGoalMenuOpen(true);
                }}
                placeholder="选择或输入 Goal"
                role="combobox"
                aria-expanded={goalMenuOpen}
                aria-controls="inbox-goal-options"
                aria-autocomplete="list"
              />
              <button
                className="inbox-goal-toggle"
                type="button"
                onClick={() => setGoalMenuOpen((open) => !open)}
                aria-label={goalMenuOpen ? "收起 Goal 列表" : "展开 Goal 列表"}
                aria-expanded={goalMenuOpen}
                aria-controls="inbox-goal-options"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            {goalMenuOpen && visibleGoals.length ? (
              <div className="inbox-goal-options" id="inbox-goal-options" role="listbox">
                {visibleGoals.map((goal) => {
                  const active = goal.id === selectedGoal?.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      className={active ? "is-active" : ""}
                      onClick={() => selectGoal(goal)}
                      role="option"
                      aria-selected={active}
                    >
                      <span style={{ backgroundColor: goal.color }} aria-hidden="true" />
                      <strong>{goal.name}</strong>
                      {active ? <Check size={15} /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="inbox-goal-colors" aria-label="Goal 颜色">
            {MORANDI_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={color === goalColor ? "is-active" : ""}
                style={{ background: color }}
                onClick={() => setGoalColor(color)}
                disabled={Boolean(selectedGoal)}
                aria-label={`选择颜色 ${color}`}
                aria-pressed={color === goalColor}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="inbox-project-actions">
        <button className="secondary-button" type="button" onClick={onClose}>取消</button>
        <button
          className="primary-button"
          type="button"
          disabled={busy || !goalName.trim() || !projectTitle.trim()}
          onClick={() => onConfirm({ goalId: selectedGoal?.id ?? null, goalName, goalColor, projectTitle })}
        >
          创建 Project
        </button>
      </div>
    </div>
  );
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}
