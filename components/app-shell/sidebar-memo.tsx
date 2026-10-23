"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check, CheckSquare2, Plus, Trash2 } from "lucide-react";
import { usePlanner } from "../planner-provider";
import { DEFAULT_MEMO_ITEMS, localDateKey, type MemoItem } from "@/lib/domain";

export type { MemoItem };

const STORAGE_KEY = "yans_plan_sidebar_memo_items_v1";
const LEGACY_STORAGE_KEY = "yans_plan_sidebar_memo_v1";

export const DUMMY_MEMO_TEXTS = new Set([
  "随时记录突然想到的事情",
  "之后一直要记得的事情",
]);

export function isDummyMemo(items?: MemoItem[] | null): boolean {
  if (!items || items.length === 0) return true;
  return items.every((item) => DUMMY_MEMO_TEXTS.has(item.text.trim()));
}

export function filterGenuineMemoItems(items?: MemoItem[] | null): MemoItem[] {
  if (!items || !Array.isArray(items)) return [];
  return items.filter((item) => item?.text && !DUMMY_MEMO_TEXTS.has(item.text.trim()));
}

export function useMemoItems() {
  const { settings, saveSettings, ready } = usePlanner();

  const genuineSettingsItems = useMemo(
    () => filterGenuineMemoItems(settings.memoItems),
    [settings.memoItems],
  );

  const items = useMemo(() => {
    // 1. If settings has genuine custom memo items (not dummy defaults), use them
    if (genuineSettingsItems.length > 0) {
      return genuineSettingsItems;
    }

    // 2. Check localStorage for user's previous memo
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as MemoItem[];
          const genuine = filterGenuineMemoItems(parsed);
          if (genuine.length > 0) {
            return genuine;
          }
        }
      } catch {}

      try {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw && legacyRaw.trim()) {
          const lines = legacyRaw.split("\n").filter((l) => l.trim().length > 0);
          const legacyItems: MemoItem[] = lines
            .map((line, idx) => {
              const isCompleted = /^\s*[-*]\s*\[[xX]\]/.test(line);
              const text = line.replace(/^\s*[-*](\s*\[[ xX]\])?\s*/, "").trim();
              return {
                id: `memo-legacy-${idx}-${text.slice(0, 10)}`,
                text,
                completed: isCompleted,
              };
            })
            .filter((item) => item.text.length > 0 && !DUMMY_MEMO_TEXTS.has(item.text));
          if (legacyItems.length > 0) return legacyItems;
        }
      } catch {}
    }

    return DEFAULT_MEMO_ITEMS;
  }, [genuineSettingsItems]);

  useEffect(() => {
    if (!ready) return;
    if (genuineSettingsItems.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(genuineSettingsItems));
      } catch {}
    } else if (items.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
      void saveSettings({ memoItems: items });
    }
  }, [genuineSettingsItems, items, ready, saveSettings]);

  const saveItems = useCallback(
    (nextItems: MemoItem[]) => {
      const clean = filterGenuineMemoItems(nextItems);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {}
      if (ready) {
        void saveSettings({ memoItems: clean });
      }
    },
    [ready, saveSettings],
  );

  return { items, saveItems };
}

export function SidebarMemo() {
  const { addTask } = usePlanner();
  const { items, saveItems } = useMemoItems();
  const [draft, setDraft] = useState("");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const activeCount = useMemo(() => {
    return items.filter((item) => !item.completed && item.text.trim().length > 0).length;
  }, [items]);

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const newItem: MemoItem = {
      id: `memo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      completed: false,
    };
    saveItems([...items, newItem]);
    setDraft("");
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 0);
  }

  function toggleItem(id: string) {
    const next = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    saveItems(next);
  }

  function updateItem(id: string, text: string) {
    const next = items.map((item) =>
      item.id === id ? { ...item, text } : item,
    );
    saveItems(next);
  }

  function deleteItem(id: string) {
    const next = items.filter((item) => item.id !== id);
    saveItems(next);
  }

  async function handleAddAsTask(text: string, id: string) {
    const cleanTitle = text.trim();
    if (!cleanTitle) return;

    const todayKey = localDateKey(new Date());
    const now = new Date();
    now.setHours(23, 59, 0, 0);

    try {
      await addTask({
        title: cleanTitle,
        planningState: "planned",
        taskKind: "ordinary",
        scheduledStartAt: `${todayKey}T09:00:00`,
        durationMinutes: 30,
        dueAt: now.toISOString(),
      });
      setAddedIds((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to add task from memo", err);
    }
  }

  return (
    <section className="sidebar-memo-section" aria-label="备忘录">
      <div className="sidebar-memo-header">
        <span className="sidebar-memo-title-label">
          <CheckSquare2 size={13} aria-hidden="true" />
          <span>备忘录</span>
          {activeCount > 0 ? (
            <span className="sidebar-memo-count">{activeCount}</span>
          ) : null}
        </span>
      </div>

      <div className="sidebar-memo-list" role="list">
        {items.length ? (
          items.map((item) => (
            <MemoRow
              key={item.id}
              item={item}
              isAdded={Boolean(addedIds[item.id])}
              onToggle={() => toggleItem(item.id)}
              onUpdate={(newText) => updateItem(item.id, newText)}
              onDelete={() => deleteItem(item.id)}
              onAddAsTask={() => void handleAddAsTask(item.text, item.id)}
            />
          ))
        ) : (
          <p className="sidebar-memo-empty">暂无备忘，在下方输入新增</p>
        )}
        <div ref={listEndRef} />
      </div>

      <form className="sidebar-memo-form" onSubmit={handleAddItem}>
        <input
          ref={inputRef}
          className="sidebar-memo-input"
          type="text"
          placeholder="记备忘... (Enter)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>
    </section>
  );
}

function MemoRow({
  item,
  isAdded,
  onToggle,
  onUpdate,
  onDelete,
  onAddAsTask,
}: {
  item: MemoItem;
  isAdded: boolean;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onAddAsTask: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prevText, setPrevText] = useState(item.text);
  const [text, setText] = useState(item.text);

  if (item.text !== prevText) {
    setPrevText(item.text);
    setText(item.text);
  }

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div
      className={`sidebar-memo-item ${item.completed ? "is-completed" : ""}`}
      role="listitem"
    >
      <button
        type="button"
        className={`sidebar-memo-circle-btn ${item.completed ? "is-checked" : ""}`}
        onClick={onToggle}
        aria-label={item.completed ? "标记为未完成" : "标记为已完成"}
        title={item.completed ? "标记为未完成" : "标记为已完成"}
      >
        {item.completed ? <Check size={10} /> : null}
      </button>

      <div className="sidebar-memo-text-wrap">
        <textarea
          ref={(el) => {
            textareaRef.current = el;
            autoResize(el);
          }}
          className="sidebar-memo-item-input"
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResize(e.target);
          }}
          onBlur={() => {
            const trimmed = text.trim();
            if (trimmed && trimmed !== item.text) {
              onUpdate(trimmed);
            } else if (!trimmed) {
              onDelete();
            } else {
              setText(item.text);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      <div className="sidebar-memo-hover-actions">
        <button
          className={`sidebar-memo-act-btn ${isAdded ? "is-added" : ""}`}
          type="button"
          title={isAdded ? "已添加到今日事项" : "添加到今日事项"}
          aria-label={isAdded ? "已添加到今日事项" : "添加到今日事项"}
          onClick={onAddAsTask}
        >
          {isAdded ? <Check size={11} /> : <Plus size={11} />}
        </button>
        <button
          className="sidebar-memo-act-btn is-delete"
          type="button"
          title="删除备忘"
          aria-label="删除备忘"
          onClick={onDelete}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
