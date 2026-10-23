"use client";

import { useState, useRef, useEffect, type CSSProperties, type FormEvent, type DragEvent } from "react";
import { Archive, ChevronDown, ChevronLeft, PanelLeftClose, Pencil, Plus, Trash2 } from "lucide-react";
import { MORANDI_COLORS, type Goal, type Project } from "@/lib/domain";
import { ProjectColorPicker } from "./project-color-picker";

export function GoalRail({
  goals,
  projects,
  currentGoalId,
  currentProjectId,
  onSelect,
  onSelectProject,
  onEdit,
  onDelete,
  onCreate,
  onCreateProject,
  onUpdateProject,
  onCreateGoalDirectly,
  onCreateGoalWithColor,
  onUpdateGoalWithColor,
  onCancelEdit,
  onMoveProject,
  onToggleCollapse,
}: {
  goals: Goal[];
  projects: Project[];
  currentGoalId: string;
  currentProjectId?: string;
  onSelect: (id: string) => void;
  onSelectProject?: (project: Project) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onCreateProject?: (goalId?: string, title?: string) => void;
  onUpdateProject?: (projectId: string, patch: Partial<Project>) => Promise<void> | void;
  onCreateGoalDirectly?: (name: string) => Promise<unknown>;
  onCreateGoalWithColor?: (name: string, color: string) => Promise<unknown>;
  onUpdateGoalWithColor?: (id: string, name: string, color: string) => Promise<unknown>;
  onCancelEdit?: () => void;
  onMoveProject?: (projectId: string, targetGoalId: string, targetOrder?: number) => Promise<void>;
  onToggleCollapse?: () => void;
}) {
  const [addingProjectGoalId, setAddingProjectGoalId] = useState<string | null>(null);
  const [inlineProjectTitle, setInlineProjectTitle] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalName, setEditingGoalName] = useState("");
  const [editingGoalColor, setEditingGoalColor] = useState<string>("#A9C7DC");
  const [isEditColorPickerExpanded, setIsEditColorPickerExpanded] = useState(true);
  const [isSubmittingEditGoal, setIsSubmittingEditGoal] = useState(false);
  const editPopoverRef = useRef<HTMLDivElement>(null);
  const [isNewGoalPopoverOpen, setIsNewGoalPopoverOpen] = useState(false);
  const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(true);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalColor, setNewGoalColor] = useState<string>("#A9C7DC");
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!isNewGoalPopoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsNewGoalPopoverOpen(false);
        setIsColorPickerExpanded(true);
        setNewGoalName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNewGoalPopoverOpen]);

  useEffect(() => {
    if (isNewGoalPopoverOpen && isColorPickerExpanded) {
      popoverRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isNewGoalPopoverOpen, isColorPickerExpanded]);

  useEffect(() => {
    if (!editingGoalId) return;
    function handleClickOutside(e: MouseEvent) {
      if (editPopoverRef.current && !editPopoverRef.current.contains(e.target as Node)) {
        setEditingGoalId(null);
        setEditingGoalName("");
        onCancelEdit?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingGoalId, onCancelEdit]);

  useEffect(() => {
    if (editingGoalId && isEditColorPickerExpanded) {
      editPopoverRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [editingGoalId, isEditColorPickerExpanded]);

  function handleStartEditGoal(e: React.MouseEvent, goal: Goal) {
    e.stopPropagation();
    setIsNewGoalPopoverOpen(false);
    setEditingGoalId(goal.id);
    setEditingGoalName(goal.name);
    setEditingGoalColor(goal.color ?? MORANDI_COLORS[0]);
    setIsEditColorPickerExpanded(true);
    onSelect(goal.id);
    onEdit?.(goal.id);
  }

  function handleCancelEditGoal() {
    setEditingGoalId(null);
    setEditingGoalName("");
    onCancelEdit?.();
  }

  async function handleEditGoalSubmit(e: FormEvent, goalId: string) {
    e.preventDefault();
    const name = editingGoalName.trim();
    if (!name || isSubmittingEditGoal) return;
    setIsSubmittingEditGoal(true);
    try {
      if (onUpdateGoalWithColor) {
        await onUpdateGoalWithColor(goalId, name, editingGoalColor);
      }
      setEditingGoalId(null);
      setEditingGoalName("");
    } finally {
      setIsSubmittingEditGoal(false);
    }
  }

  async function handleNewGoalSubmit(e: FormEvent) {
    e.preventDefault();
    const name = newGoalName.trim();
    if (!name || isSubmittingGoal) return;
    setIsSubmittingGoal(true);
    try {
      if (onCreateGoalWithColor) {
        await onCreateGoalWithColor(name, newGoalColor);
      } else if (onCreateGoalDirectly) {
        await onCreateGoalDirectly(name);
      } else if (onCreate) {
        onCreate();
      }
      setIsNewGoalPopoverOpen(false);
      setIsColorPickerExpanded(true);
      setNewGoalName("");
    } finally {
      setIsSubmittingGoal(false);
    }
  }

  function handleInlineProjectSubmit(event: FormEvent, goalId: string) {
    event.preventDefault();
    const title = inlineProjectTitle.trim();
    if (title && onCreateProject) {
      onCreateProject(goalId, title);
    }
    setInlineProjectTitle("");
    setAddingProjectGoalId(null);
  }

  function handleDragStart(e: DragEvent, projectId: string) {
    e.dataTransfer.setData("application/x-project-id", projectId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedProjectId(projectId);
  }

  function handleDragEnd() {
    setDraggedProjectId(null);
    setDragOverGoalId(null);
    setDragOverProjectId(null);
  }

  function handleGoalDragOver(e: DragEvent, goalId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverGoalId !== goalId) {
      setDragOverGoalId(goalId);
    }
  }

  function handleGoalDrop(e: DragEvent, goalId: string) {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("application/x-project-id") || draggedProjectId;
    if (projectId && onMoveProject) {
      void onMoveProject(projectId, goalId);
    }
    setDragOverGoalId(null);
    setDraggedProjectId(null);
  }

  function handleProjectDragOver(e: DragEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverProjectId !== projectId) {
      setDragOverProjectId(projectId);
    }
  }

  function handleProjectDrop(e: DragEvent, targetProject: Project) {
    e.preventDefault();
    e.stopPropagation();
    const projectId = e.dataTransfer.getData("application/x-project-id") || draggedProjectId;
    if (projectId && projectId !== targetProject.id && onMoveProject) {
      void onMoveProject(projectId, targetProject.goalId, targetProject.order);
    }
    setDragOverProjectId(null);
    setDragOverGoalId(null);
    setDraggedProjectId(null);
  }

  return (
    <aside className="projects-goal-rail">
      <nav className="projects-goal-nav" aria-label="Goals 与 Projects 导航">
        <div className="projects-rail-header">
          <span className="projects-rail-header-title">目标与项目</span>
          {onToggleCollapse ? (
            <button
              type="button"
              className="projects-rail-collapse-btn"
              onClick={onToggleCollapse}
              title="折叠侧边栏"
              aria-label="折叠侧边栏"
            >
              <PanelLeftClose size={14} />
            </button>
          ) : null}
        </div>
        <div className="projects-rail-groups">
          {goals.map((goal, index) => {
            const isCurrentGoal = currentGoalId === goal.id;
            const goalColor = goal.color ?? MORANDI_COLORS[index % MORANDI_COLORS.length];
            const goalProjects = projects
              .filter((p) => p.goalId === goal.id && p.status !== "completed" && p.status !== "abandoned")
              .sort((a, b) => a.order - b.order);
            const isGoalDragOver = dragOverGoalId === goal.id;
            const isEditingThisGoal = editingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className={`projects-goal-group ${isGoalDragOver ? "is-drag-over" : ""}`}
                style={{ "--goal-color": isEditingThisGoal ? editingGoalColor : goalColor } as CSSProperties}
                onDragOver={(e) => handleGoalDragOver(e, goal.id)}
                onDragLeave={() => {
                  if (dragOverGoalId === goal.id) setDragOverGoalId(null);
                }}
                onDrop={(e) => handleGoalDrop(e, goal.id)}
              >
                {isEditingThisGoal ? (
                  <div
                    className="projects-new-goal-popover projects-edit-goal-popover"
                    ref={editPopoverRef}
                    role="dialog"
                    aria-label={`编辑目标：${goal.name}`}
                  >
                    <div className="projects-new-goal-popover-header">
                      <h4>编辑目标</h4>
                    </div>
                    <form onSubmit={(e) => handleEditGoalSubmit(e, goal.id)} className="projects-new-goal-form">
                      <input
                        autoFocus
                        className="projects-new-goal-input"
                        placeholder="目标名称"
                        value={editingGoalName}
                        onChange={(e) => setEditingGoalName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            handleCancelEditGoal();
                          }
                        }}
                      />
                      <div className="projects-new-goal-color-section">
                        <button
                          type="button"
                          className="projects-new-goal-color-row"
                          onClick={() => setIsEditColorPickerExpanded(!isEditColorPickerExpanded)}
                          aria-expanded={isEditColorPickerExpanded}
                          aria-label={`颜色设置，当前为 ${editingGoalColor}`}
                        >
                          <span className="projects-new-goal-color-label">颜色</span>
                          <div className="projects-new-goal-color-value">
                            <span
                              className="projects-new-goal-color-dot-indicator"
                              style={{ backgroundColor: editingGoalColor }}
                              aria-hidden="true"
                            />
                            <span className="projects-new-goal-color-hex">{editingGoalColor.toUpperCase()}</span>
                            <ChevronDown
                              size={12}
                              className={`projects-new-goal-color-chevron ${isEditColorPickerExpanded ? "is-expanded" : ""}`}
                              aria-hidden="true"
                            />
                          </div>
                        </button>
                        {isEditColorPickerExpanded ? (
                          <div className="projects-new-goal-color-picker-wrapper">
                            <ProjectColorPicker color={editingGoalColor} onChange={setEditingGoalColor} />
                          </div>
                        ) : null}
                      </div>
                      <div className="projects-new-goal-actions">
                        <button
                          type="button"
                          className="projects-new-goal-cancel-btn"
                          onClick={handleCancelEditGoal}
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="projects-new-goal-create-btn"
                          disabled={!editingGoalName.trim() || isSubmittingEditGoal}
                        >
                          {isSubmittingEditGoal ? "保存中…" : "保存"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Goal Header Row */
                  <div className={`projects-goal-row ${isCurrentGoal ? "is-active" : ""}`}>
                    <button
                      className="projects-goal-item-btn"
                      type="button"
                      onClick={() => {
                        onSelect(goal.id);
                        if (goalProjects.length && (!currentProjectId || !goalProjects.some((p) => p.id === currentProjectId))) {
                          onSelectProject?.(goalProjects[0]);
                        }
                      }}
                      aria-label={`${goal.name}，${goalProjects.length} 个 Project`}
                      title={goal.name}
                    >
                      <span className="projects-goal-dot" style={{ backgroundColor: goalColor }} />
                      <span className="projects-goal-name">{goal.name}</span>
                    </button>

                    <div className="projects-goal-row-actions">
                      <button
                        className="projects-goal-action-btn"
                        type="button"
                        onClick={() => setAddingProjectGoalId(goal.id)}
                        title="新建项目"
                        aria-label={`在 ${goal.name} 下新建项目`}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        className="projects-goal-action-btn"
                        type="button"
                        onClick={(e) => handleStartEditGoal(e, goal)}
                        aria-label={`编辑 Goal：${goal.name}`}
                        title="编辑 Goal"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="projects-goal-action-btn is-delete"
                        type="button"
                        onClick={() => onDelete(goal.id)}
                        aria-label={`删除 Goal：${goal.name}`}
                        title="删除 Goal"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-list of Projects directly under this Goal */}
                <div className="projects-goal-sublist">
                  {goalProjects.map((p) => {
                    const isCurrentProject = currentProjectId === p.id;
                    const isProjectDragOver = dragOverProjectId === p.id;

                    if (editingProjectId === p.id) {
                      return (
                        <div key={p.id} className="projects-project-subitem is-editing">
                          <span className="projects-project-dot" style={{ backgroundColor: goalColor }} />
                          <input
                            autoFocus
                            className="projects-project-inline-input"
                            value={editingProjectTitle}
                            onChange={(e) => setEditingProjectTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const trimmed = editingProjectTitle.trim();
                                if (trimmed && trimmed !== p.title && onUpdateProject) {
                                  void onUpdateProject(p.id, { title: trimmed });
                                }
                                setEditingProjectId(null);
                              } else if (e.key === "Escape") {
                                setEditingProjectId(null);
                              }
                            }}
                            onBlur={() => {
                              const trimmed = editingProjectTitle.trim();
                              if (trimmed && trimmed !== p.title && onUpdateProject) {
                                void onUpdateProject(p.id, { title: trimmed });
                              }
                              setEditingProjectId(null);
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={p.id}
                        className={`projects-project-subitem ${isCurrentProject ? "is-active" : ""} ${
                          isProjectDragOver ? "is-drag-over" : ""
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleProjectDragOver(e, p.id)}
                        onDragLeave={() => {
                          if (dragOverProjectId === p.id) setDragOverProjectId(null);
                        }}
                        onDrop={(e) => handleProjectDrop(e, p)}
                      >
                        <button
                          type="button"
                          className="projects-project-subitem-btn"
                          onClick={() => {
                            onSelect(goal.id);
                            onSelectProject?.(p);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(p.id);
                            setEditingProjectTitle(p.title);
                          }}
                          title={p.title}
                        >
                          <span className="projects-project-dot" style={{ backgroundColor: goalColor }} />
                          <span className="projects-project-subitem-title">{p.title}</span>
                        </button>
                        <div className="projects-project-subitem-actions">
                          <button
                            type="button"
                            className="projects-project-action-btn"
                            title="重命名项目"
                            aria-label={`重命名项目：${p.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectId(p.id);
                              setEditingProjectTitle(p.title);
                            }}
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {addingProjectGoalId === goal.id ? (
                    <div className="projects-project-subitem is-creating">
                      <span className="projects-project-dot" style={{ backgroundColor: goalColor }} />
                      <input
                        autoFocus
                        className="projects-project-inline-input"
                        placeholder="项目名称..."
                        value={inlineProjectTitle}
                        onChange={(e) => setInlineProjectTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleInlineProjectSubmit(e, goal.id);
                          } else if (e.key === "Escape") {
                            setAddingProjectGoalId(null);
                            setInlineProjectTitle("");
                          }
                        }}
                        onBlur={() => {
                          const title = inlineProjectTitle.trim();
                          if (title && onCreateProject) {
                            onCreateProject(goal.id, title);
                          }
                          setInlineProjectTitle("");
                          setAddingProjectGoalId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="projects-subitem-add-trigger"
                      onClick={() => {
                        setAddingProjectGoalId(goal.id);
                        setInlineProjectTitle("");
                      }}
                    >
                      <Plus size={11} />
                      <span>新建项目</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Goal In-Place Panel */}
          <div className="projects-rail-footer" ref={popoverRef}>
            {isNewGoalPopoverOpen ? (
              <div className="projects-new-goal-popover" role="dialog" aria-label="新建目标">
                <div className="projects-new-goal-popover-header">
                  <h4>新建目标</h4>
                </div>
                <form onSubmit={handleNewGoalSubmit} className="projects-new-goal-form">
                  <input
                    autoFocus
                    className="projects-new-goal-input"
                    placeholder="目标名称"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsNewGoalPopoverOpen(false);
                        setIsColorPickerExpanded(false);
                        setNewGoalName("");
                      }
                    }}
                  />
                  <div className="projects-new-goal-color-section">
                    <button
                      type="button"
                      className="projects-new-goal-color-row"
                      onClick={() => setIsColorPickerExpanded(!isColorPickerExpanded)}
                      aria-expanded={isColorPickerExpanded}
                      aria-label={`颜色设置，当前为 ${newGoalColor}`}
                    >
                      <span className="projects-new-goal-color-label">颜色</span>
                      <div className="projects-new-goal-color-value">
                        <span
                          className="projects-new-goal-color-dot-indicator"
                          style={{ backgroundColor: newGoalColor }}
                          aria-hidden="true"
                        />
                        <span className="projects-new-goal-color-hex">{newGoalColor.toUpperCase()}</span>
                        <ChevronDown
                          size={12}
                          className={`projects-new-goal-color-chevron ${isColorPickerExpanded ? "is-expanded" : ""}`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                    {isColorPickerExpanded ? (
                      <div className="projects-new-goal-color-picker-wrapper">
                        <ProjectColorPicker color={newGoalColor} onChange={setNewGoalColor} />
                      </div>
                    ) : null}
                  </div>
                  <div className="projects-new-goal-actions">
                    <button
                      type="button"
                      className="projects-new-goal-cancel-btn"
                      onClick={() => {
                        setIsNewGoalPopoverOpen(false);
                        setIsColorPickerExpanded(true);
                        setNewGoalName("");
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="projects-new-goal-create-btn"
                      disabled={!newGoalName.trim() || isSubmittingGoal}
                    >
                      创建
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                type="button"
                className="projects-rail-add-trigger"
                onClick={() => {
                  setEditingGoalId(null);
                  setIsNewGoalPopoverOpen(true);
                  setIsColorPickerExpanded(true);
                  setNewGoalName("");
                  setNewGoalColor("#A9C7DC");
                }}
                aria-expanded={false}
                aria-label="新建目标"
              >
                <Plus size={13} />
                <span>新建目标</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function GoalForm({
  name,
  color,
  busy,
  label,
  busyLabel,
  onNameChange,
  onColorChange,
  onCancel,
  onSubmit,
}: {
  name: string;
  color: string;
  busy: boolean;
  label: string;
  busyLabel: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onCancel?: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="projects-create-form-wrap">
      <form className="projects-goal-form" aria-label={label} onSubmit={onSubmit}>
        <div className="projects-form-field">
          <label className="projects-form-label">Goal 名称</label>
          <input
            autoFocus
            aria-label="Goal 名称"
            className="projects-form-input"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="长期方向，例如：科研、学习、生活"
          />
        </div>
        <div className="projects-form-field">
          <label className="projects-form-label">主题颜色</label>
          <div className="morandi-palette" aria-label="Goal 颜色">
            {MORANDI_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                className={color === item ? "is-active" : ""}
                style={{ backgroundColor: item }}
                onClick={() => onColorChange(item)}
                aria-label={`选择颜色 ${item}`}
              />
            ))}
          </div>
        </div>
        <div className="projects-goal-form-actions">
          <button className="primary-button" type="submit" disabled={!name.trim() || busy}>
            {busy ? busyLabel : label}
          </button>
          {onCancel ? (
            <button className="secondary-button" type="button" disabled={busy} onClick={onCancel}>
              取消
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function ProjectTabs({
  goal,
  currentProject,
  activeProjects,
  archivedProjects,
  archiveOpen,
  projectProgressMap,
  onSelect,
  onCreate,
  onShowActive,
  onShowArchive,
}: {
  goal: Goal;
  currentProject: Project | null;
  activeProjects: Project[];
  archivedProjects: Project[];
  archiveOpen: boolean;
  projectProgressMap?: Record<string, { completed: number; total: number }>;
  onSelect: (project: Project) => void;
  onCreate: () => void;
  onShowActive: () => void;
  onShowArchive: () => void;
}) {
  return (
    <div className="project-tabs" role="tablist" aria-label={`${goal.name} 的 Project`}>
      {archiveOpen ? (
        <>
          <button className="project-tab-back" type="button" onClick={onShowActive}>
            <ChevronLeft size={14} /> 返回
          </button>
          {archivedProjects.map((project) => (
            <button
              key={project.id}
              className={currentProject?.id === project.id ? "project-tab-card is-active" : "project-tab-card"}
              type="button"
              role="tab"
              aria-selected={currentProject?.id === project.id}
              onClick={() => onSelect(project)}
            >
              <span className="project-tab-title">{project.title}</span>
            </button>
          ))}
        </>
      ) : (
        <>
          {activeProjects.map((project) => {
            const prog = projectProgressMap?.[project.id];
            return (
              <button
                key={project.id}
                className={currentProject?.id === project.id ? "project-tab-card is-active" : "project-tab-card"}
                type="button"
                role="tab"
                aria-selected={currentProject?.id === project.id}
                onClick={() => onSelect(project)}
              >
                <span className="project-tab-title">{project.title}</span>
                {prog && prog.total > 0 ? (
                  <span className="project-tab-progress">
                    {prog.completed}/{prog.total}
                  </span>
                ) : null}
                {project.initializationState === "draft" ? <small>待初始化</small> : null}
              </button>
            );
          })}
          <button className="project-tab-create" type="button" onClick={onCreate}>
            <Plus size={14} /> 新建 Project
          </button>
          <button className="project-tab-archive" type="button" onClick={onShowArchive}>
            <Archive size={14} /> 归档 Project
            {archivedProjects.length ? <small>{archivedProjects.length}</small> : null}
          </button>
        </>
      )}
    </div>
  );
}
