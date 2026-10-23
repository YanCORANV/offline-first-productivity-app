"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Modal drafts intentionally reset when opened. */

import "./schedule-block-composer.css";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fromDateTimeLocal, localDateKey, toDateTimeLocal, type PlannerTask, type ProjectNode, type ScheduleBlock } from "@/lib/domain";
import { usePlanner } from "../planner-provider";
import { InspectorShell } from "../composer-shell";
import { makeRules, ReminderPicker } from "../composer-shared";
import { ComposerActions } from "../task-composer/actions";

function timeLocal(value?: string | null): string {
  const local = toDateTimeLocal(value);
  return local ? local.slice(11, 16) : "";
}

export function ScheduleBlockComposer({
  open,
  source,
  block,
  defaultDate,
  onClose,
}: {
  open: boolean;
  source: PlannerTask | ProjectNode | null;
  block?: ScheduleBlock | null;
  defaultDate?: Date;
  onClose: () => void;
}) {
  const { addScheduleBlock, updateScheduleBlock, deleteScheduleBlock } = usePlanner();
  const base = useMemo(() => defaultDate ?? new Date(), [defaultDate]);
  const [date, setDate] = useState(localDateKey(base));
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reminders, setReminders] = useState<number[]>([]);
  const [status, setStatus] = useState<ScheduleBlock["status"]>("planned");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(block?.date ?? localDateKey(base));
    setStartAt(timeLocal(block?.startAt));
    setEndAt(timeLocal(block?.endAt));
    setReminders((block?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
    setStatus(block?.status ?? "planned");
    setError("");
  }, [base, block, open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!source) return;
    const startIso = startAt ? fromDateTimeLocal(`${date}T${startAt}`) : null;
    const endIso = endAt ? fromDateTimeLocal(`${date}T${endAt}`) : null;
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      setError("结束时间必须晚于开始时间，时间块不能跨日。");
      return;
    }
    const patch = {
      sourceType: source.entityType === "task" ? ("task" as const) : ("projectNode" as const),
      sourceId: source.id,
      date,
      startAt: startIso,
      endAt: endIso,
      reminderRules: makeRules(reminders, "start"),
      status,
    };
    if (block) await updateScheduleBlock(block.id, patch);
    else await addScheduleBlock(patch);
    onClose();
  }

  if (!open || !source) return null;
  return (
    <InspectorShell title={`安排：${source.title}`} panelClassName="schedule-block-composer-inspector" onClose={onClose}>
      <form className="composer-form schedule-block-composer-form" onSubmit={submit}>
        <label className="field"><span>日期</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="field-grid">
          <label className="field"><span>开始时间（可选）</span><input type="time" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></label>
          <label className="field"><span>结束时间（可选）</span><input type="time" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></label>
        </div>
        <div className="task-schedule-overrides" role="group" aria-label="快捷时段">
          <button
            type="button"
            className={startAt === "09:00" && endAt === "12:00" ? "is-active" : ""}
            onClick={() => {
              setStartAt("09:00");
              setEndAt("12:00");
            }}
          >
            仅上午
          </button>
          <button
            type="button"
            className={startAt === "12:00" && endAt === "18:00" ? "is-active" : ""}
            onClick={() => {
              setStartAt("12:00");
              setEndAt("18:00");
            }}
          >
            仅下午
          </button>
          <button
            type="button"
            className={!startAt && !endAt ? "is-active" : ""}
            onClick={() => {
              setStartAt("");
              setEndAt("");
            }}
          >
            待安排
          </button>
        </div>
        {error ? <p className="schedule-block-error" role="alert">{error}</p> : null}
        <ReminderPicker values={reminders} onChange={setReminders} />
        {block ? (
          <label className="field">
             <span>执行状态</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ScheduleBlock["status"])
              }
            >
               <option value="planned">计划</option>
              <option value="performed">已执行（不自动完成任务）</option>
               <option value="skipped">已跳过</option>
            </select>
          </label>
        ) : null}
        <ComposerActions
          enabled={Boolean(date)}
          onClose={onClose}
           label="保存时间块"
          onDelete={
            block
              ? async () => {
                  await deleteScheduleBlock(block.id);
                  onClose();
                }
              : undefined
          }
        />
      </form>
    </InspectorShell>
  );
}
