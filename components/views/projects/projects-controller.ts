"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
} from "react";
import { useAppNavigation } from "../../app-navigation";
import { usePlanner } from "../../planner-provider";
import {
  localDateKey,
  MORANDI_COLORS,
  type Project,
  type ProjectNode,
} from "@/lib/domain";
import {
  buildChatGptContext,
  buildProjectMarkdown,
  parseProjectMarkdown,
  parseProjectOutline,
  type OutlineCandidate,
} from "@/lib/planning";
import {
  normalizeCandidateParents,
  type ProjectViewMode,
} from "./project-components";

function isArchivedProject(project: Project) {
  return project.status === "completed" || project.status === "abandoned";
}

export function useProjectsController() {
  const planner = usePlanner();
  const { intent, navigate } = useAppNavigation();
  const {
    goals,
    projects,
    projectNodes,
    scheduleBlocks,
    settings,
    addGoal,
    updateGoal,
    deleteGoal,
    addProject,
    updateProject,
    deleteProject,
    duplicateProject,
    importProjectOutline,
    addProjectNode,
    updateProjectNode,
    moveProjectNode,
    deleteProjectNode,
    toggleProjectNode,
    setProjectNodeFocus,
    saveSettings,
  } = planner;

  const visibleGoals = goals.filter((goal) => !goal.archived);
  const defaultGoalId =
    settings.currentGoalId && visibleGoals.some((goal) => goal.id === settings.currentGoalId)
      ? settings.currentGoalId
      : visibleGoals[0]?.id ?? "";
  const [goalId, setGoalId] = useState(defaultGoalId);
  const [projectId, setProjectId] = useState(
    intent.projectId ?? settings.lastProjectByGoal[defaultGoalId] ?? "",
  );
  const [mode, setMode] = useState<ProjectViewMode>("outline");
  const [markdownDrafts, setMarkdownDrafts] = useState<Record<string, string>>({});
  const [newGoalOpen, setNewGoalOpen] = useState(!visibleGoals.length);
  const [newGoal, setNewGoal] = useState("");
  const [newGoalColor, setNewGoalColor] = useState<string>(MORANDI_COLORS[0]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [blockSource, setBlockSource] = useState<ProjectNode | null>(null);
  const [initializerOpen, setInitializerOpen] = useState(Boolean(intent.initializeProject));
  const [mapScale, setMapScale] = useState(1);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalDraftName, setGoalDraftName] = useState("");
  const [goalDraftColor, setGoalDraftColor] = useState<string>(MORANDI_COLORS[0]);
  const [savingGoal, setSavingGoal] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteGoalTargetId, setDeleteGoalTargetId] = useState<string | null>(null);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [endProjectOpen, setEndProjectOpen] = useState(false);
  const [archivingProject, setArchivingProject] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [movingProject, setMovingProject] = useState(false);
  const [copyingProject, setCopyingProject] = useState(false);
  const copyingProjectRef = useRef(false);
  const [nodeDeleteTarget, setNodeDeleteTarget] = useState<string | null>(null);

  const currentGoalId = visibleGoals.some((goal) => goal.id === goalId)
    ? goalId
    : visibleGoals[0]?.id ?? "";
  const currentGoal = visibleGoals.find((goal) => goal.id === currentGoalId) ?? null;
  const deleteGoalTarget = visibleGoals.find((goal) => goal.id === deleteGoalTargetId) ?? null;
  const editingGoal = visibleGoals.find((goal) => goal.id === editingGoalId) ?? null;
  const goalProjects = projects.filter((project) => project.goalId === currentGoalId);
  const activeProjects = goalProjects.filter((project) => !isArchivedProject(project));
  const archivedProjects = goalProjects.filter(isArchivedProject);
  const displayedProjects = archiveOpen ? archivedProjects : activeProjects;
  const preferredProjectId = settings.lastProjectByGoal[currentGoalId];
  const currentProject =
    displayedProjects.find((project) => project.id === projectId) ??
    (!archiveOpen ? activeProjects.find((project) => project.id === preferredProjectId) : null) ??
    (!archiveOpen ? activeProjects[0] : null) ??
    null;
  const nodes = currentProject
    ? projectNodes.filter((node) => node.projectId === currentProject.id)
    : [];
  const generatedMarkdown =
    currentGoal && currentProject
      ? buildProjectMarkdown(currentGoal, currentProject, nodes)
      : "";
  const markdownDraft = currentProject
    ? markdownDrafts[currentProject.id] ?? generatedMarkdown
    : "";
  const parentNodeIds = new Set(nodes.map((node) => node.parentId).filter(Boolean));
  const leaves = nodes.filter((node) => !parentNodeIds.has(node.id));
  const progress = {
    completed: leaves.filter((node) => node.status === "completed").length,
    total: leaves.length,
  };

  const projectProgressMap = projects.reduce<Record<string, { completed: number; total: number }>>(
    (acc, p) => {
      const pNodes = projectNodes.filter((n) => n.projectId === p.id);
      const pParentIds = new Set(pNodes.map((n) => n.parentId).filter(Boolean));
      const pLeaves = pNodes.filter((n) => !pParentIds.has(n.id));
      acc[p.id] = {
        completed: pLeaves.filter((n) => n.status === "completed").length,
        total: pLeaves.length,
      };
      return acc;
    },
    {},
  );

  useEffect(() => {
    if (!intent.projectId) return;
    const target = projects.find((project) => project.id === intent.projectId);
    if (!target) return;
    const timeout = window.setTimeout(() => {
      setGoalId(target.goalId);
      setProjectId(target.id);
      setArchiveOpen(isArchivedProject(target));
      setInitializerOpen(intent.initializeProject || target.initializationState === "draft");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [intent.initializeProject, intent.projectId, projects]);

  useEffect(() => {
    if (!currentGoalId || settings.currentGoalId === currentGoalId) return;
    void saveSettings({ currentGoalId });
  }, [currentGoalId, saveSettings, settings.currentGoalId]);

  useEffect(() => {
    if (!currentGoalId || !currentProject || archiveOpen || isArchivedProject(currentProject)) return;
    if (settings.lastProjectByGoal[currentGoalId] === currentProject.id) return;
    void saveSettings({
      lastProjectByGoal: {
        ...settings.lastProjectByGoal,
        [currentGoalId]: currentProject.id,
      },
    });
  }, [archiveOpen, currentGoalId, currentProject, saveSettings, settings.lastProjectByGoal]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    if (!newGoal.trim() || creatingGoal) return;
    setCreatingGoal(true);
    setError("");
    try {
      const goal = await addGoal(newGoal, newGoalColor);
      setGoalId(goal.id);
      setProjectId("");
      setNewGoal("");
      setNewGoalOpen(false);
      setNotice(`已进入 Goal：${goal.name}`);
    } catch {
      setError("Goal 没有创建成功，请再试一次。");
    } finally {
      setCreatingGoal(false);
    }
  }

  function startGoalEdit(id: string) {
    const goal = visibleGoals.find((item) => item.id === id);
    if (!goal) return;
    switchGoal(id);
    setEditingGoalId(id);
    setGoalDraftName(goal.name);
    setGoalDraftColor(goal.color ?? MORANDI_COLORS[0]);
    setNewGoalOpen(false);
  }

  function cancelGoalEdit() {
    setEditingGoalId(null);
    setGoalDraftName("");
  }

  function openGoalCreate() {
    cancelGoalEdit();
    setNewGoalOpen(true);
  }

  async function saveGoal(event: FormEvent) {
    event.preventDefault();
    const name = goalDraftName.trim();
    if (!editingGoal || !name || savingGoal) return;
    setSavingGoal(true);
    setError("");
    try {
      await updateGoal(editingGoal.id, { name, color: goalDraftColor });
      cancelGoalEdit();
      setNotice(`Goal 已更新：${name}`);
    } catch {
      setError("Goal 没有保存成功，请再试一次。");
    } finally {
      setSavingGoal(false);
    }
  }

  async function updateGoalWithColor(id: string, name: string, color: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateGoal(id, { name: trimmed, color });
      cancelGoalEdit();
      setNotice(`Goal 已更新：${trimmed}`);
    } catch {
      setError("Goal 保存失败，请重试");
    }
  }

  async function createProjectDirectly(targetGoalId?: string, title = "新项目") {
    const targetGoal = targetGoalId || currentGoalId || visibleGoals[0]?.id;
    if (!targetGoal) {
      setError("请先创建一个目标");
      return null;
    }
    setError("");
    try {
      const project = await addProject(targetGoal, title);
      setGoalId(targetGoal);
      setProjectId(project.id);
      setInitializerOpen(false);
      navigate("projects", { projectId: project.id });
      setNotice(`已创建 Project：${project.title}`);
      return project;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project 创建失败");
      return null;
    }
  }

  async function createGoalDirectly(name: string, color?: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setCreatingGoal(true);
    setError("");
    try {
      const goal = await addGoal(trimmed, color ?? MORANDI_COLORS[visibleGoals.length % MORANDI_COLORS.length]);
      setGoalId(goal.id);
      setProjectId("");
      setNewGoalOpen(false);
      setNotice(`已创建目标：${goal.name}`);
      return goal;
    } catch {
      setError("目标创建失败，请重试");
      return null;
    } finally {
      setCreatingGoal(false);
    }
  }

  async function dropNode(event: DragEvent, parentId: string | null) {
    event.preventDefault();
    const id =
      event.dataTransfer.getData("application/project-node") ||
      event.dataTransfer.getData("application/x-project-task-id") ||
      event.dataTransfer.getData("application/x-project-block-id");
    if (!id || id === parentId) return;
    try {
      await moveProjectNode(id, parentId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "节点移动失败");
    }
  }

  async function reorderNode(nodeId: string, parentId: string | null, targetOrder?: number) {
    try {
      await moveProjectNode(nodeId, parentId, targetOrder);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "节点排序失败");
    }
  }

  function switchGoal(id: string) {
    navigate("projects");
    setEditingGoalId(null);
    setNewGoalOpen(false);
    setGoalId(id);
    setProjectId(settings.lastProjectByGoal[id] ?? "");
    setArchiveOpen(false);
    setInitializerOpen(false);
    setError("");
  }

  async function copyContext() {
    if (!currentGoal || !currentProject) return;
    await navigator.clipboard.writeText(buildChatGptContext(currentGoal, currentProject, nodes));
    setNotice("已复制给 GPT。讨论完成后，可在 Markdown 模式粘贴并解析结果。");
  }

  async function changeProjectStatus(status: Project["status"]) {
    if (!currentProject) return;
    await updateProject(currentProject.id, { status });
    setNotice(
      status === "completed"
        ? "Project 已归档"
        : status === "paused"
          ? "Project 已暂停"
          : "Project 已继续",
    );
  }

  async function removeGoal() {
    if (!deleteGoalTargetId) return;
    const nextGoal = visibleGoals.find((goal) => goal.id !== deleteGoalTargetId) ?? null;
    setDeletingGoal(true);
    setError("");
    try {
      await deleteGoal(deleteGoalTargetId);
      navigate("projects");
      setGoalId(nextGoal?.id ?? "");
      setProjectId(nextGoal ? settings.lastProjectByGoal[nextGoal.id] ?? "" : "");
      setArchiveOpen(false);
      setInitializerOpen(false);
      setDeleteGoalTargetId(null);
      if (editingGoalId === deleteGoalTargetId) cancelGoalEdit();
      setNewGoalOpen(!nextGoal);
      setNotice("Goal 及其中的 Projects 和安排已删除");
    } catch {
      setError("Goal 没有删除成功，请稍后再试。");
    } finally {
      setDeletingGoal(false);
    }
  }

  async function copyProject() {
    if (!currentProject || copyingProjectRef.current) return;
    copyingProjectRef.current = true;
    setCopyingProject(true);
    setError("");
    try {
      const copy = await duplicateProject(currentProject.id);
      if (!copy) return;
      setArchiveOpen(false);
      setProjectId(copy.id);
      setInitializerOpen(copy.initializationState === "draft");
      navigate("projects", { projectId: copy.id });
      setNotice("已复制整棵结构，完成状态与安排已重置");
    } catch {
      setError("Project 没有复制成功，请稍后再试。");
    } finally {
      copyingProjectRef.current = false;
      setCopyingProject(false);
    }
  }

  async function moveCurrentProject(nextGoalId: string) {
    const project = currentProject;
    const nextGoal = visibleGoals.find((goal) => goal.id === nextGoalId);
    if (!project || !nextGoal || project.goalId === nextGoalId || movingProject) return;
    setMovingProject(true);
    setError("");
    try {
      await updateProject(project.id, {
        goalId: nextGoalId,
        order: projects.filter((item) => item.goalId === nextGoalId).length,
      });
      setGoalId(nextGoalId);
      setProjectId(project.id);
      setArchiveOpen(isArchivedProject(project));
      setInitializerOpen(project.initializationState === "draft");
      navigate("projects", { projectId: project.id });
      setNotice(`Project 已移动到 Goal：${nextGoal.name}`);
    } catch {
      setError("Project 没有移动成功，请稍后再试。");
    } finally {
      setMovingProject(false);
    }
  }

  async function moveProject(projectId: string, targetGoalId: string, newOrder?: number) {
    const project = projects.find((p) => p.id === projectId);
    const targetGoal = visibleGoals.find((goal) => goal.id === targetGoalId);
    if (!project || !targetGoal) return;
    try {
      const sameGoalProjects = projects
        .filter((p) => p.goalId === targetGoalId && p.id !== projectId)
        .sort((a, b) => a.order - b.order);
      const computedOrder = typeof newOrder === "number" ? newOrder : sameGoalProjects.length;
      await updateProject(project.id, {
        goalId: targetGoalId,
        order: computedOrder,
      });
      if (currentProject?.id === projectId) {
        setGoalId(targetGoalId);
      }
      setNotice(`已将项目「${project.title}」移动到「${targetGoal.name}」`);
    } catch {
      setError("移动项目失败，请稍后再试。");
    }
  }


  async function removeCurrentProject() {
    if (!currentProject) return;
    const removedProject = currentProject;
    const nextProject = displayedProjects.find((project) => project.id !== removedProject.id);
    setDeletingProject(true);
    setError("");
    setProjectId(nextProject?.id ?? "");
    navigate("projects", nextProject ? { projectId: nextProject.id } : undefined);
    setInitializerOpen(false);
    setDeleteProjectOpen(false);
    try {
      await deleteProject(removedProject.id);
      setNotice("Project 及其安排已删除");
    } catch {
      setProjectId(removedProject.id);
      navigate("projects", { projectId: removedProject.id });
      setInitializerOpen(removedProject.initializationState === "draft");
      setError("Project 没有删除成功，请稍后再试。");
    } finally {
      setDeletingProject(false);
    }
  }

  async function archiveCurrentProject() {
    if (!currentProject) return;
    setArchivingProject(true);
    setError("");
    try {
      await updateProject(currentProject.id, { status: "completed" });
      const nextProject = activeProjects.find((project) => project.id !== currentProject.id);
      navigate("projects", nextProject ? { projectId: nextProject.id } : undefined);
      setArchiveOpen(false);
      setProjectId(nextProject?.id ?? "");
      setEndProjectOpen(false);
      setNotice("Project 已归档");
    } catch {
      setError("Project 没有归档成功，请稍后再试。");
    } finally {
      setArchivingProject(false);
    }
  }

  async function addNode(title: string, parentId: string | null = null) {
    if (!currentProject) return;
    try {
      await addProjectNode(currentProject.id, parentId, title);
    } catch (err) {
      console.error("Failed to add project node", err);
      setError("添加节点失败");
    }
  }

  async function scheduleNodeToday(node: ProjectNode) {
    const today = localDateKey(new Date());
    try {
      await planner.addScheduleBlock({
        sourceType: "projectNode",
        sourceId: node.id,
        date: today,
        reminderRules: [],
      });
      setNotice(`已将「${node.title}」安排到今天`);
    } catch (err) {
      console.error("Failed to schedule block for today", err);
      setError("安排到今天失败");
    }
  }

  async function parseMarkdownIntoProject(customMarkdown?: string) {
    if (!currentGoal || !currentProject) return;
    const textToParse = (customMarkdown !== undefined ? customMarkdown : (markdownDrafts[currentProject.id] ?? generatedMarkdown)).trim();
    if (!textToParse) return;

    let candidates: OutlineCandidate[] = [];
    const result = parseProjectMarkdown(textToParse);
    if (result.candidates.length) {
      candidates = normalizeCandidateParents(result.candidates);
    } else {
      candidates = parseProjectOutline(textToParse);
    }

    if (!candidates.length) {
      setError(result.errors.join("；") || "Markdown 中没有可执行节点");
      return;
    }

    try {
      const updated = await importProjectOutline(
        currentGoal.id,
        currentProject.title,
        candidates,
        currentProject.sourceThoughtIds ?? [],
        currentProject.id,
      );
      setProjectId(updated.id);
      setError("");
      setNotice(`Markdown 已解析为 ${candidates.length} 个节点`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Markdown 同步失败");
    }
  }

  function setCurrentMarkdownDraft(value: string) {
    if (!currentProject) return;
    setMarkdownDrafts((drafts) => ({ ...drafts, [currentProject.id]: value }));
  }

  const goalStyle = {
    "--goal-color": currentGoal?.color ?? MORANDI_COLORS[0],
  } as CSSProperties;

  return {
    visibleGoals,
    projects,
    currentGoalId,
    currentGoal,
    deleteGoalTarget,
    editingGoal,
    activeProjects,
    archivedProjects,
    currentProject,
    nodes,
    scheduleBlocks,
    progress,
    projectProgressMap,
    generatedMarkdown,
    markdownDraft,
    goalStyle,
    mode,
    mapScale,
    collapsed,
    archiveOpen,
    initializerOpen,
    notice,
    error,
    newGoalOpen,
    newGoal,
    newGoalColor,
    creatingGoal,
    goalDraftName,
    goalDraftColor,
    savingGoal,
    deletingGoal,
    archivingProject,
    deletingProject,
    movingProject,
    copyingProject,
    deleteGoalTargetId,
    endProjectOpen,
    deleteProjectOpen,
    nodeDeleteTarget,
    blockSource,
    createGoal,
    saveGoal,
    switchGoal,
    startGoalEdit,
    cancelGoalEdit,
    openGoalCreate,
    setDeleteGoalTargetId,
    setNewGoalOpen,
    setNewGoal,
    setNewGoalColor,
    setGoalDraftName,
    setGoalDraftColor,
    setProjectId,
    setInitializerOpen,
    setArchiveOpen,
    setMode,
    setMapScale,
    setMarkdownDraft: setCurrentMarkdownDraft,
    setCollapsed,
    setBlockSource,
    setEndProjectOpen,
    setDeleteProjectOpen,
    setNodeDeleteTarget,
    setError,
    copyContext,
    copyProject,
    moveCurrentProject,
    moveProject,
    changeProjectStatus,
    parseMarkdownIntoProject,
    removeGoal,
    removeCurrentProject,
    archiveCurrentProject,
    dropNode,
    reorderNode,
    addNode,
    scheduleNodeToday,
    addProjectNode,
    updateProject,
    updateProjectNode,
    toggleProjectNode,
    setProjectNodeFocus,
    createProjectDirectly,
    createGoalDirectly,
    updateGoalWithColor,
    deleteProjectNode,
    navigate,
    preferredProjectId,
  };
}

function parseFlexibleMarkdownOutline(input: string): { title: string; parentIndex: number | null; checkpoint?: boolean }[] {
  const lines = input.split(/\r?\n/);
  const candidates: { title: string; parentIndex: number | null; checkpoint?: boolean }[] = [];
  const stack: { level: number; index: number }[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === "---" || trimmed.startsWith("goal:") || trimmed.startsWith("project:")) continue;

    let level = 1;
    let title = trimmed;
    let isTask = false;

    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      level = headingMatch[1].length;
      title = headingMatch[2].trim();
      isTask = level >= 3;
    } else {
      const bulletMatch = rawLine.match(/^(\s*)([-*]|\d+\.)(\s+\[([ xX])\])?\s+(.*)$/);
      if (bulletMatch) {
        const indentSpaces = bulletMatch[1].length;
        level = 2 + Math.floor(indentSpaces / 2);
        title = bulletMatch[5].trim();
        isTask = true;
      } else {
        level = 1;
        title = trimmed;
      }
    }

    if (!title) continue;

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parentIndex = stack.length > 0 ? stack[stack.length - 1].index : null;
    const currentIndex = candidates.length;
    candidates.push({
      title,
      parentIndex,
      checkpoint: isTask,
    });
    stack.push({ level, index: currentIndex });
  }

  return candidates;
}
