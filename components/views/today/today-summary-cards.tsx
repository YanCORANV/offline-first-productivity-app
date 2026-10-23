import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Check,
  CheckSquare2,
  ChevronRight,
  CornerDownLeft,
  FolderTree,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { localDateKey, type PlannerSettings, type PlannerTask, type Project, type QuickThought } from "@/lib/domain";
import { useMemoItems, type MemoItem } from "../../app-shell/sidebar-memo";
import { usePlanner } from "../../planner-provider";

function formatDeadlineInfo(deadlineAt?: string | null) {
  if (!deadlineAt) return null;
  const d = new Date(deadlineAt);
  if (isNaN(d.getTime())) return null;
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  let remainingText = "";
  let isUrgent = false;
  if (diffDays < 0) {
    remainingText = `已逾期 ${Math.abs(diffDays)} 天`;
    isUrgent = true;
  } else if (diffDays === 0) {
    remainingText = "今天截止";
    isUrgent = true;
  } else if (diffDays === 1) {
    remainingText = "还剩 1 天";
    isUrgent = true;
  } else {
    remainingText = `还剩 ${diffDays} 天`;
    isUrgent = diffDays <= 4;
  }
  return { dateStr, remainingText, isUrgent };
}

function getTaskCategory(task: PlannerTask, settings?: PlannerSettings) {
  if (task.itemTypeId) {
    const itemType = settings?.itemTypes.find((t) => t.id === task.itemTypeId);
    if (itemType) return itemType.name;
  }
  if (task.taskKind === "assignment") return "课程";
  return "临时";
}

function formatThoughtTime(isoString: string) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export function TodaySummaryCards({
  assignments,
  thoughts,
  settings,
  projects,
  onTask,
  onToggleTask,
  onThought,
  onArchiveThought,
  onConvertThought,
  onConvertToTask,
  onConvertToProject,
  onDeleteThought,
  onAddThought,
  onOpenInbox,
  onOpenProjects,
  defaultInboxExpanded = false,
}: {
  assignments: PlannerTask[];
  thoughts: QuickThought[];
  settings?: PlannerSettings;
  projects?: Project[];
  openSections?: { deadlines: boolean; inbox: boolean };
  onSectionChange?: (section: "deadlines" | "inbox", open: boolean) => void;
  onTask: (task: PlannerTask) => void;
  onToggleTask?: (taskId: string) => void;
  onThought?: (id: string) => void;
  onArchiveThought?: (id: string) => void;
  onConvertThought?: (id: string) => void;
  onConvertToTask?: (id: string) => void;
  onConvertToProject?: (id: string) => void;
  onDeleteThought?: (id: string) => void;
  onAddThought?: (content: string) => Promise<void>;
  onOpenInbox?: () => void;
  onOpenProjects?: () => void;
  defaultInboxExpanded?: boolean;
}) {
  const [quickThoughtInput, setQuickThoughtInput] = useState("");
  const [submittingThought, setSubmittingThought] = useState(false);
  const [showAllInbox, setShowAllInbox] = useState(Boolean(defaultInboxExpanded));
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const displayedThoughts = showAllInbox ? thoughts : thoughts.slice(0, 3);

  // Sort assignments by closest deadline
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aTime = a.actualDeadlineAt || a.desiredCompletionAt || a.dueAt || "9999";
    const bTime = b.actualDeadlineAt || b.desiredCompletionAt || b.dueAt || "9999";
    return aTime.localeCompare(bTime);
  });

  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const displayedAssignments = showAllDeadlines ? sortedAssignments : sortedAssignments.slice(0, 5);

  const isCommittingThoughtRef = useRef(false);

  async function submitQuickThought() {
    const content = quickThoughtInput.trim();
    if (!content || submittingThought || isCommittingThoughtRef.current || !onAddThought) return;
    try {
      isCommittingThoughtRef.current = true;
      setSubmittingThought(true);
      await onAddThought(content);
      setQuickThoughtInput("");
    } finally {
      setSubmittingThought(false);
      isCommittingThoughtRef.current = false;
    }
  }

  async function handleQuickAddThought(e: React.FormEvent) {
    e.preventDefault();
    await submitQuickThought();
  }

  return (
    <>
      {/* 1. Deadline · 近期截止 卡片 */}
      <section className="today-ref-card today-deadline-card">
        <header className="today-ref-card-header">
          <div className="today-ref-header-left">
            <h3 className="today-ref-card-title">
              <strong>Deadline</strong> · 近期截止
            </h3>
            <span className="today-ref-badge">{assignments.length}</span>
          </div>
          {sortedAssignments.length > 5 ? (
            <button
              type="button"
              className="today-ref-link-btn"
              onClick={() => setShowAllDeadlines((prev) => !prev)}
              aria-label={showAllDeadlines ? "收起截止事项" : "查看全部截止事项"}
            >
              {showAllDeadlines ? "收起" : `查看全部 (${sortedAssignments.length})`}
              <ChevronRight
                size={13}
                aria-hidden="true"
                style={{
                  transform: showAllDeadlines ? "rotate(-90deg)" : "none",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          ) : null}
        </header>

        <div className="today-ref-list">
          {displayedAssignments.length ? (
            displayedAssignments.map((task) => {
              const deadline = task.actualDeadlineAt || task.desiredCompletionAt || task.dueAt;
              const info = formatDeadlineInfo(deadline);
              const category = getTaskCategory(task, settings);
              const showCategory = category && category.trim().toLowerCase() !== "deadline";
              return (
                <div className="today-ref-row today-deadline-row" key={task.id}>
                  <button
                    type="button"
                    className="today-ref-check-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask?.(task.id);
                    }}
                    aria-label={`标记完成 ${task.title}`}
                  >
                    <span className="today-ref-check-circle" />
                  </button>
                  <button
                    type="button"
                    className="today-ref-content-btn"
                    onClick={() => onTask(task)}
                  >
                    <span className="today-ref-item-title">{task.title}</span>
                    {showCategory ? <span className="today-ref-item-subtitle">{category}</span> : null}
                  </button>
                  {info ? (
                    <div className="today-deadline-right" onClick={() => onTask(task)}>
                      <span className="today-deadline-date">{info.dateStr}</span>
                      <span className={`today-deadline-countdown ${info.isUrgent ? "is-urgent" : ""}`}>
                        {info.remainingText}
                      </span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="today-ref-arrow-btn"
                    onClick={() => onTask(task)}
                    aria-label="查看详情"
                  >
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="today-ref-empty">暂无近期截止事项</p>
          )}
        </div>
      </section>

      {/* 2. Inbox · 收集箱 卡片 */}
      <section className={`today-ref-card today-inbox-card ${showAllInbox ? "is-expanded" : ""}`}>
        <header className="today-ref-card-header">
          <div className="today-ref-header-left">
            <h3 className="today-ref-card-title">
              <strong>Inbox</strong> · 收集箱
            </h3>
            <span className="today-ref-badge">{thoughts.length}</span>
          </div>
          {thoughts.length > 3 ? (
            <button
              type="button"
              className="today-ref-link-btn"
              onClick={() => setShowAllInbox((prev) => !prev)}
              aria-label={showAllInbox ? "收起收集箱" : "展开全部收集箱"}
            >
              {showAllInbox ? "收起" : `全部 (${thoughts.length})`}
              <ChevronRight
                size={13}
                aria-hidden="true"
                style={{
                  transform: showAllInbox ? "rotate(-90deg)" : "none",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          ) : null}
        </header>

        <div className="today-ref-list">
          {displayedThoughts.length ? (
            <>
              {displayedThoughts.map((thought) => {
                const isSelected = selectedThoughtId === thought.id;
                return (
                  <div
                    className={`today-inbox-item-container ${isSelected ? "is-selected" : ""}`}
                    key={thought.id}
                  >
                    <div
                      className={`today-ref-row today-inbox-row ${isSelected ? "is-selected" : ""}`}
                      onClick={() =>
                        setSelectedThoughtId((prev) => (prev === thought.id ? null : thought.id))
                      }
                      role="button"
                      tabIndex={0}
                      aria-expanded={isSelected}
                      aria-label={`收集项：${thought.content}，点击展开处理选项`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedThoughtId((prev) => (prev === thought.id ? null : thought.id));
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="today-ref-check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveThought?.(thought.id);
                        }}
                        aria-label={`完成归档 ${thought.content}`}
                        title="完成归档"
                      >
                        <span className="today-ref-check-circle" />
                      </button>
                      <div className="today-ref-content-btn today-inbox-content">
                        <span className="today-ref-item-title">{thought.content}</span>
                      </div>
                      <span className="today-inbox-date">
                        {formatThoughtTime(thought.createdAt)}
                      </span>
                      <button
                        type="button"
                        className={`today-inbox-more-trigger ${isSelected ? "is-active" : ""}`}
                        aria-label={isSelected ? "收起操作" : "操作菜单"}
                        title="处理条目"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThoughtId((prev) => (prev === thought.id ? null : thought.id));
                        }}
                      >
                        <MoreHorizontal size={14} aria-hidden="true" />
                      </button>
                    </div>

                    {isSelected ? (
                      <div className="today-inbox-item-menu" role="menu">
                        <button
                          type="button"
                          className="today-inbox-menu-btn is-task"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedThoughtId(null);
                            if (onConvertToTask) onConvertToTask(thought.id);
                            else if (onConvertThought) onConvertThought(thought.id);
                          }}
                        >
                          <CheckSquare2 size={13} aria-hidden="true" />
                          <span>转为事项</span>
                        </button>
                        {onConvertToProject ? (
                          <button
                            type="button"
                            className="today-inbox-menu-btn is-project"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThoughtId(null);
                              onConvertToProject(thought.id);
                            }}
                          >
                            <FolderTree size={13} aria-hidden="true" />
                            <span>转为 Project</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="today-inbox-menu-btn is-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedThoughtId(null);
                            onDeleteThought?.(thought.id);
                          }}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          <span>删除</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : (
            <p className="today-ref-empty">收集箱为空</p>
          )}
        </div>

        {/* 快速添加到收集箱输入框 */}
        <form className="today-inbox-quick-add" onSubmit={handleQuickAddThought}>
          <Plus size={15} className="today-inbox-add-icon" aria-hidden="true" />
          <input
            type="text"
            className="today-inbox-input"
            placeholder="快速添加到收集箱..."
            value={quickThoughtInput}
            onChange={(e) => setQuickThoughtInput(e.target.value)}
            onBlur={() => {
              if (quickThoughtInput.trim()) {
                void submitQuickThought();
              }
            }}
            enterKeyHint="done"
            disabled={submittingThought}
          />
          <button
            type="submit"
            className="today-inbox-submit-btn"
            disabled={!quickThoughtInput.trim() || submittingThought}
            aria-label="提交添加到收集箱"
          >
            <CornerDownLeft size={13} aria-hidden="true" />
          </button>
        </form>
      </section>

      {/* 3. Memo · 备忘录 卡片 */}
      <TodayMemoSection />
    </>
  );
}

function TodayMemoSection() {
  const { addTask } = usePlanner();
  const { items, saveItems } = useMemoItems();
  const [showAllMemo, setShowAllMemo] = useState(false);
  const [draft, setDraft] = useState("");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const activeCount = useMemo(() => {
    return items.filter((item) => !item.completed && item.text.trim().length > 0).length;
  }, [items]);

  const displayedItems = showAllMemo ? items : items.slice(0, 3);

  function handleAddItem(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const newItem: MemoItem = {
      id: `memo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      completed: false,
    };
    saveItems([...items, newItem]);
    setDraft("");
  }

  function toggleItem(id: string) {
    saveItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function updateItem(id: string, text: string) {
    saveItems(
      items.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function deleteItem(id: string) {
    saveItems(items.filter((item) => item.id !== id));
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
    <section
      className={`today-ref-card today-memo-card ${showAllMemo ? "is-expanded" : ""}`}
      aria-label="备忘录"
    >
      <header className="today-ref-card-header">
        <div className="today-ref-header-left">
          <h3 className="today-ref-card-title">
            <strong>Memo</strong> · 备忘录
          </h3>
          {activeCount > 0 ? (
            <span className="today-ref-badge">{activeCount}</span>
          ) : null}
        </div>
        {items.length > 3 ? (
          <button
            type="button"
            className="today-ref-link-btn"
            onClick={() => setShowAllMemo((prev) => !prev)}
            aria-label={showAllMemo ? "收起备忘录" : "展开全部备忘录"}
          >
            {showAllMemo ? "收起" : `全部 (${items.length})`}
            <ChevronRight
              size={13}
              aria-hidden="true"
              style={{
                transform: showAllMemo ? "rotate(-90deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            />
          </button>
        ) : null}
      </header>

      <div className="today-ref-list">
        {displayedItems.length ? (
          displayedItems.map((item) => (
            <TodayMemoRow
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
          <p className="today-ref-empty">暂无备忘事项</p>
        )}
      </div>

      {/* 快速添加备忘输入框 */}
      <form className="today-inbox-quick-add" onSubmit={handleAddItem}>
        <Plus size={15} className="today-inbox-add-icon" aria-hidden="true" />
        <input
          type="text"
          className="today-inbox-input"
          placeholder="快速添加备忘... (Enter)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="today-inbox-submit-btn"
          disabled={!draft.trim()}
          aria-label="提交添加到备忘录"
        >
          <CornerDownLeft size={13} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function TodayMemoRow({
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
  const [prevText, setPrevText] = useState(item.text);
  const [text, setText] = useState(item.text);

  if (item.text !== prevText) {
    setPrevText(item.text);
    setText(item.text);
  }

  return (
    <div className={`today-ref-row today-memo-row ${item.completed ? "is-completed" : ""}`}>
      <button
        type="button"
        className="today-ref-check-btn"
        onClick={onToggle}
        aria-label={item.completed ? "标记为未完成" : "标记为已完成"}
      >
        <span className={`today-ref-check-circle ${item.completed ? "is-checked" : ""}`}>
          {item.completed ? <Check size={11} strokeWidth={3} /> : null}
        </span>
      </button>

      <div className="today-memo-text-wrap">
        <input
          type="text"
          className="today-memo-item-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
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
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      <div className="today-memo-actions">
        <button
          type="button"
          className={`today-memo-action-btn ${isAdded ? "is-added" : ""}`}
          onClick={onAddAsTask}
          title={isAdded ? "已添加到今日" : "添加到今日事项"}
          aria-label={isAdded ? "已添加到今日" : "添加到今日事项"}
        >
          {isAdded ? <Check size={12} /> : <Plus size={13} />}
        </button>
        <button
          type="button"
          className="today-memo-action-btn is-delete"
          onClick={onDelete}
          title="删除备忘"
          aria-label="删除备忘"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
