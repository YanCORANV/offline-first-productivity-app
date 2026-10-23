import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { newId } from "@/lib/domain";
import { quickTaskEntries, splitQuickTaskText, type QuickTaskRow } from "./calendar-quick-add-model";

export interface CalendarQuickAddProps {
  date: Date;
  initialRows?: QuickTaskRow[];
  onClose: (rows: QuickTaskRow[]) => void;
  onSave: (entries: ReturnType<typeof quickTaskEntries>) => Promise<void>;
}

function emptyRow(title = ""): QuickTaskRow {
  return { id: newId("quick-task"), title, completed: false };
}

export function useCalendarQuickAdd({ initialRows, onSave, onClose }: CalendarQuickAddProps) {
  const [rows, setRows] = useState(() => initialRows?.length ? initialRows : [emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState<{ row: QuickTaskRow; index: number } | null>(null);
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const savingRef = useRef(false);
  const entries = quickTaskEntries(rows);

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputs.current.values().next().value?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    for (const input of inputs.current.values()) {
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight + 2}px`;
    }
  }, [rows]);

  function focusRow(id: string) {
    requestAnimationFrame(() => {
      const input = inputs.current.get(id);
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function updateRow(id: string, patch: Partial<Pick<QuickTaskRow, "title" | "completed">>) {
    if (savingRef.current) return;
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
    setError("");
  }

  function addRow() {
    if (savingRef.current) return;
    const blank = rows.find((row) => !row.title.trim());
    if (blank) return focusRow(blank.id);
    const row = emptyRow();
    setRows((current) => [...current, row]);
    focusRow(row.id);
  }

  function insertText(id: string, start: number, end: number, text: string) {
    if (savingRef.current) return;
    const index = rows.findIndex((row) => row.id === id);
    const row = rows[index];
    if (!row) return;
    if (text === "\n" && !row.title.trim()) {
      focusRow(rows[index + 1]?.id ?? id);
      return;
    }
    const lines = splitQuickTaskText(row.title, start, end, text);
    const inserted = lines.slice(1).map((title) => emptyRow(title));
    setRows([
      ...rows.slice(0, index),
      { ...row, title: lines[0] },
      ...inserted,
      ...rows.slice(index + 1),
    ]);
    setError("");
    focusRow(inserted.at(-1)?.id ?? id);
  }

  function removeRow(id: string) {
    if (savingRef.current) return;
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return;
    if (rows[index].title.trim()) setRemoved({ row: rows[index], index });
    const next = rows.filter((row) => row.id !== id);
    if (!next.length) next.push(emptyRow());
    setRows(next);
    setError("");
    focusRow(next[Math.max(0, index - 1)].id);
  }

  function undoRemove() {
    if (!removed || savingRef.current) return;
    const next = rows.filter((row) => row.title.trim());
    next.splice(Math.min(removed.index, next.length), 0, removed.row);
    setRows(next);
    focusRow(removed.row.id);
    setRemoved(null);
  }

  function close() {
    if (!savingRef.current) onClose(rows);
  }

  async function submit() {
    if (!entries.length || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave(entries);
    } catch {
      setError("未能保存，内容已保留，请重试。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { rows, entries, inputs, saving, error, removed, updateRow, addRow, insertText, removeRow, undoRemove, close, submit };
}
