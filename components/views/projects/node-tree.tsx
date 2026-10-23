"use client";

import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from "react";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ProjectNode, ScheduleBlock } from "@/lib/domain";
import { buildProjectTreeIndex, type ProjectTreeIndex } from "@/lib/planning";
import type { ProjectViewMode } from "./project-outline";

const SECTION_ACCENTS = ["#0071e3", "#34c759", "#af52de", "#ff9500", "#00c7be", "#5856d6", "#ff2d55"];

function cleanBlockDisplayTitle(title: string) {
  return title.replace(/^\[.*?\]\s*/, "");
}

function resizeNodeTitle(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function SectionCardItem({
  block,
  blockIndex,
  subTasks,
  onUpdate,
  onToggle,
  onDelete,
  onAddNode,
  onReorderNode,
}: {
  block: ProjectNode;
  blockIndex: number;
  subTasks: ProjectNode[];
  onUpdate: (id: string, patch: Partial<ProjectNode>) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddNode?: (title: string, parentId: string | null) => Promise<void>;
  onReorderNode?: (nodeId: string, parentId: string | null, targetOrder?: number) => Promise<void>;
}) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isDragOverCard, setIsDragOverCard] = useState(false);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const isBlockCompleted = block.status === "completed";
  const accentColor = SECTION_ACCENTS[blockIndex % SECTION_ACCENTS.length];

  function handleCreateTask() {
    const trimmed = newTaskTitle.trim();
    if (trimmed && onAddNode) {
      void onAddNode(trimmed, block.id);
      setNewTaskTitle("");
    } else {
      setIsAddingTask(false);
      setNewTaskTitle("");
    }
  }

  return (
    <div
      className={`project-section-card ${isBlockCompleted ? "is-completed" : ""} ${
        isDragOverCard ? "is-drag-over" : ""
      }`}
      style={{ "--card-accent": accentColor } as CSSProperties}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOverCard) setIsDragOverCard(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOverCard(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOverCard(false);
        const taskId = e.dataTransfer.getData("application/x-project-task-id");
        if (taskId) {
          void onReorderNode?.(taskId, block.id, subTasks.length);
          return;
        }
        const blockId = e.dataTransfer.getData("application/x-project-block-id");
        if (blockId && blockId !== block.id) {
          void onReorderNode?.(blockId, null, block.order);
        }
      }}
    >
      {/* Top delicate accent strip */}
      <div className="project-card-top-bar" style={{ backgroundColor: accentColor }} />

      {/* Card Header */}
      <div className="project-card-header">
        <div className="project-card-header-left">
          {/* Reorder drag handle (visible on hover) */}
          <div
            className="project-card-drag-handle"
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-project-block-id", block.id);
              e.dataTransfer.setData("application/project-node", block.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            title="拖动调整任务块顺序"
          >
            <GripVertical size={13} />
          </div>

          <button
            type="button"
            className={`project-node-circle is-section ${isBlockCompleted ? "is-checked" : ""}`}
            onClick={() => void onToggle(block.id)}
            aria-label={isBlockCompleted ? "标记为未完成" : "标记为完成"}
          >
            {isBlockCompleted ? <Check size={9} strokeWidth={3} /> : null}
          </button>

          <textarea
            className="node-inline-title"
            data-completed={isBlockCompleted}
            defaultValue={cleanBlockDisplayTitle(block.title)}
            rows={1}
            placeholder="任务块名称"
            ref={(element) => resizeNodeTitle(element)}
            onInput={(e) => resizeNodeTitle(e.currentTarget)}
            onBlur={(e) => {
              const raw = e.target.value.replace(/\s+/g, " ").trim();
              const newTitle = raw || cleanBlockDisplayTitle(block.title);
              e.currentTarget.value = newTitle;
              resizeNodeTitle(e.currentTarget);
              if (newTitle !== block.title) void onUpdate(block.id, { title: newTitle });
            }}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        </div>

        <button
          type="button"
          className="project-card-more-btn"
          onClick={() => void onDelete(block.id)}
          title="删除任务块"
          aria-label="删除任务块"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Tasks List inside card */}
      <div className="project-card-tasks">
        {subTasks.map((task) => {
          const isTaskCompleted = task.status === "completed";
          const isTaskDragOver = dragOverTaskId === task.id;

          return (
            <div
              key={task.id}
              className={`project-task-row ${isTaskCompleted ? "is-completed" : ""} ${
                isTaskDragOver ? "is-drag-over" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
                if (dragOverTaskId !== task.id) setDragOverTaskId(task.id);
              }}
              onDragLeave={() => {
                if (dragOverTaskId === task.id) setDragOverTaskId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverTaskId(null);
                const taskId = e.dataTransfer.getData("application/x-project-task-id");
                if (taskId && taskId !== task.id) {
                  void onReorderNode?.(taskId, block.id, task.order);
                }
              }}
            >
              <div
                className="project-task-drag-handle"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-project-task-id", task.id);
                  e.dataTransfer.setData("application/project-node", task.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                title="拖动调整任务顺序"
              >
                <GripVertical size={12} />
              </div>

              <button
                type="button"
                className={`project-node-circle is-task ${isTaskCompleted ? "is-checked" : ""}`}
                onClick={() => void onToggle(task.id)}
                aria-label={isTaskCompleted ? "标记为未完成" : "标记为完成"}
              >
                {isTaskCompleted ? <Check size={8} strokeWidth={3} /> : null}
              </button>

              <textarea
                className="node-inline-title"
                data-step="true"
                data-completed={isTaskCompleted}
                defaultValue={task.title}
                rows={1}
                placeholder="任务名称"
                ref={(element) => resizeNodeTitle(element)}
                onInput={(e) => resizeNodeTitle(e.currentTarget)}
                onBlur={(e) => {
                  const title = e.target.value.replace(/\s+/g, " ").trim();
                  e.currentTarget.value = title || task.title;
                  resizeNodeTitle(e.currentTarget);
                  if (title && title !== task.title) void onUpdate(task.id, { title });
                }}
                onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              />

              <button
                type="button"
                className="project-node-delete-btn"
                title="删除任务"
                aria-label="删除任务"
                onClick={() => void onDelete(task.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}

        {/* Inline Task Creation Row */}
        {isAddingTask ? (
          <div className="project-task-row is-creating">
            <span className="project-node-circle is-task is-placeholder" />
            <input
              autoFocus
              className="node-inline-title node-new-task-input"
              placeholder="任务名称..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTask();
                } else if (e.key === "Escape") {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                }
              }}
              onBlur={() => {
                if (!newTaskTitle.trim()) {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                } else {
                  handleCreateTask();
                }
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Card Footer: + Add task */}
      {!isAddingTask ? (
        <div className="project-card-footer">
          <button
            type="button"
            className="project-card-add-task-btn"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus size={12} />
            <span>添加任务</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function NodeTree({
  nodes,
  onUpdate,
  onToggle,
  onDelete,
  onAddNode,
  onReorderNode,
  treeIndex,
}: {
  nodes: ProjectNode[];
  parentId?: string | null;
  mode?: ProjectViewMode;
  collapsed: string[];
  scheduleBlocks?: ScheduleBlock[];
  onCollapse: (ids: string[]) => void;
  onMove?: (event: DragEvent, parentId: string | null) => Promise<void>;
  onReorderNode?: (nodeId: string, parentId: string | null, targetOrder?: number) => Promise<void>;
  onUpdate: (id: string, patch: Partial<ProjectNode>) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onFocus?: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSchedule?: (node: ProjectNode) => void;
  onScheduleToday?: (node: ProjectNode) => void;
  onAddNode?: (title: string, parentId: string | null) => Promise<void>;
  treeIndex?: ProjectTreeIndex;
  collapsedIds?: Set<string>;
  plannedSourceIds?: Set<string>;
}) {
  const index = treeIndex ?? buildProjectTreeIndex(nodes);
  const rootBlocks = index.childrenByParentId.get(null) ?? [];

  // Distribute rootBlocks into two independent streaming columns
  const col0: ProjectNode[] = [];
  const col1: ProjectNode[] = [];
  rootBlocks.forEach((block, idx) => {
    if (idx % 2 === 0) col0.push(block);
    else col1.push(block);
  });

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  async function handleCreateSection() {
    const trimmed = newSectionTitle.trim();
    if (trimmed && onAddNode) {
      await onAddNode(trimmed, null);
    }
    setIsAddingSection(false);
    setNewSectionTitle("");
  }

  const addSectionInlineCard = (
    <div className="project-section-card is-creating">
      <div className="project-card-header">
        <div className="project-card-header-left">
          <span className="project-node-circle is-section is-placeholder" />
          <input
            autoFocus
            className="node-new-section-input"
            placeholder="任务块名称..."
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateSection();
              } else if (e.key === "Escape") {
                setIsAddingSection(false);
                setNewSectionTitle("");
              }
            }}
            onBlur={() => {
              void handleCreateSection();
            }}
          />
        </div>
      </div>
    </div>
  );

  const addSectionButton = isAddingSection ? (
    addSectionInlineCard
  ) : (
    <button
      type="button"
      className="project-add-section-card-btn"
      onClick={() => {
        setIsAddingSection(true);
        setNewSectionTitle("");
      }}
    >
      <Plus size={14} />
      <span>添加任务块</span>
    </button>
  );

  return (
    <div className="project-blocks-container">
      {rootBlocks.length ? (
        <div className="project-cards-masonry">
          {/* Column 0 */}
          <div className="project-cards-col">
            {col0.map((block, idx) => {
              const subTasks = index.childrenByParentId.get(block.id) ?? [];
              return (
                <SectionCardItem
                  key={block.id}
                  block={block}
                  blockIndex={idx * 2}
                  subTasks={subTasks}
                  onUpdate={onUpdate}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onAddNode={onAddNode}
                  onReorderNode={onReorderNode}
                />
              );
            })}
            {col0.length <= col1.length ? addSectionButton : null}
          </div>

          {/* Column 1 */}
          <div className="project-cards-col">
            {col1.map((block, idx) => {
              const subTasks = index.childrenByParentId.get(block.id) ?? [];
              return (
                <SectionCardItem
                  key={block.id}
                  block={block}
                  blockIndex={idx * 2 + 1}
                  subTasks={subTasks}
                  onUpdate={onUpdate}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onAddNode={onAddNode}
                  onReorderNode={onReorderNode}
                />
              );
            })}
            {col1.length < col0.length ? addSectionButton : null}
          </div>
        </div>
      ) : isAddingSection ? (
        <div className="project-first-section-wrap">
          {addSectionInlineCard}
        </div>
      ) : (
        <div className="project-first-section-wrap">
          <button
            type="button"
            className="project-first-section-btn"
            onClick={() => {
              setIsAddingSection(true);
              setNewSectionTitle("");
            }}
          >
            <Plus size={15} />
            <span>添加任务块</span>
          </button>
        </div>
      )}
    </div>
  );
}
