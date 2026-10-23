"use client";
import { useState } from "react";
import "./projects.css";

import { PanelLeftOpen } from "lucide-react";
import { ScheduleBlockComposer } from "../../composers";
import {
  ProjectEditor,
  ProjectInitializer,
  type ProjectViewMode,
} from "./project-components";
import { ProjectDialogs } from "./project-dialogs";
import { GoalRail } from "./project-navigation";
import { useProjectsController } from "./projects-controller";

export function ProjectsView() {
  const projects = useProjectsController();
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);

  return (
    <>
      {projects.notice ? <div className="inline-toast" role="status">{projects.notice}</div> : null}

      <section
        className={`projects-workspace ${isRailCollapsed ? "is-rail-collapsed" : ""}`}
        style={projects.goalStyle}
        key={projects.currentGoalId || "empty"}
      >
        <GoalRail
          goals={projects.visibleGoals}
          projects={projects.projects}
          currentGoalId={projects.currentGoalId}
          currentProjectId={projects.currentProject?.id}
          onSelect={projects.switchGoal}
          onSelectProject={(project) => {
            projects.switchGoal(project.goalId);
            projects.setProjectId(project.id);
            projects.setInitializerOpen(false);
            projects.navigate("projects", { projectId: project.id });
          }}
          onEdit={projects.startGoalEdit}
          onDelete={projects.setDeleteGoalTargetId}
          onCreate={projects.openGoalCreate}
          onCreateGoalDirectly={projects.createGoalDirectly}
          onCreateGoalWithColor={projects.createGoalDirectly}
          onUpdateGoalWithColor={projects.updateGoalWithColor}
          onCancelEdit={projects.cancelGoalEdit}
          onCreateProject={(goalId, title) => void projects.createProjectDirectly(goalId || projects.currentGoalId, title)}
          onUpdateProject={(projectId, patch) => projects.updateProject(projectId, patch)}
          onMoveProject={projects.moveProject}
          onToggleCollapse={() => setIsRailCollapsed((prev) => !prev)}
        />

        <div className="projects-content">
          {isRailCollapsed ? (
            <button
              type="button"
              className="projects-rail-expand-btn"
              onClick={() => setIsRailCollapsed(false)}
              title="展开侧边栏"
              aria-label="展开侧边栏"
            >
              <PanelLeftOpen size={15} />
              <span>展开侧边栏</span>
            </button>
          ) : null}
          {projects.currentGoal ? (
            <>
              {projects.initializerOpen && projects.currentProject?.initializationState === "draft" ? (
                <ProjectInitializer
                  key={`${projects.currentGoal.id}-${projects.currentProject?.id ?? "new"}`}
                  goal={projects.currentGoal}
                  goals={projects.visibleGoals}
                  targetProject={projects.currentProject}
                  movingProject={projects.movingProject}
                  onCancel={() => projects.setInitializerOpen(false)}
                  onDelete={() => projects.setDeleteProjectOpen(true)}
                  onGoalChange={(goalId) => void projects.moveCurrentProject(goalId)}
                  onReady={(project) => {
                    projects.setProjectId(project.id);
                    projects.setInitializerOpen(false);
                    projects.navigate("projects", { projectId: project.id });
                  }}
                />
              ) : projects.currentProject ? (
                <ProjectEditor
                  project={projects.currentProject}
                  goals={projects.visibleGoals}
                  nodes={projects.nodes}
                  scheduleBlocks={projects.scheduleBlocks}
                  progress={projects.progress}
                  mode={projects.mode}
                  mapScale={projects.mapScale}
                  markdownDraft={projects.markdownDraft}
                  generatedMarkdown={projects.generatedMarkdown}
                  error={projects.error}
                  movingProject={projects.movingProject}
                  copyingProject={projects.copyingProject}
                  collapsed={projects.collapsed}
                  onModeChange={projects.setMode as (mode: ProjectViewMode) => void}
                  onMapScaleChange={projects.setMapScale}
                  onMarkdownChange={projects.setMarkdownDraft}
                  onParseMarkdown={(customMarkdown) => void projects.parseMarkdownIntoProject(customMarkdown)}
                  onProjectUpdate={(patch) => projects.updateProject(projects.currentProject!.id, patch)}
                  onGoalChange={(goalId) => void projects.moveCurrentProject(goalId)}
                  onCopyContext={() => void projects.copyContext()}
                  onStatusChange={(status) => void projects.changeProjectStatus(status)}
                  onCopyProject={() => void projects.copyProject()}
                  onEndProject={() => projects.setEndProjectOpen(true)}
                  onDeleteProject={() => projects.setDeleteProjectOpen(true)}
                  onCollapse={projects.setCollapsed}
                  onMoveNode={projects.dropNode}
                  onReorderNode={projects.reorderNode}
                  onAddNode={projects.addNode}
                  onUpdateNode={projects.updateProjectNode}
                  onToggleNode={projects.toggleProjectNode}
                  onDeleteNode={async (id) => {
                    projects.setNodeDeleteTarget(id);
                  }}
                  onScheduleNode={projects.setBlockSource}
                  onScheduleToday={projects.scheduleNodeToday}
                />
              ) : (
                <div className="projects-empty-state-wrap">
                  <div className="projects-quiet-empty">
                    <h3 className="projects-empty-title">项目</h3>
                    <p className="projects-empty-desc">在左侧选择或新建项目开始规划</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="projects-empty-state-wrap">
              <div className="projects-quiet-empty">
                <h3 className="projects-empty-title">目标</h3>
                <p className="projects-empty-desc">在左侧新建目标，开启结构化规划</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <ScheduleBlockComposer
        open={Boolean(projects.blockSource)}
        source={projects.blockSource}
        onClose={() => projects.setBlockSource(null)}
      />
      <ProjectDialogs
        deleteGoalTarget={projects.deleteGoalTarget}
        currentProject={projects.currentProject}
        nodeDeleteTarget={projects.nodeDeleteTarget}
        endProjectOpen={projects.endProjectOpen}
        deleteProjectOpen={projects.deleteProjectOpen}
        deletingGoal={projects.deletingGoal}
        archivingProject={projects.archivingProject}
        deletingProject={projects.deletingProject}
        onCloseGoalDelete={() => projects.setDeleteGoalTargetId(null)}
        onDeleteGoal={projects.removeGoal}
        onCloseProjectEnd={() => projects.setEndProjectOpen(false)}
        onArchiveProject={projects.archiveCurrentProject}
        onCloseProjectDelete={() => projects.setDeleteProjectOpen(false)}
        onDeleteProject={projects.removeCurrentProject}
        onCloseNodeDelete={() => projects.setNodeDeleteTarget(null)}
        onDeleteNode={async (id) => {
          projects.setNodeDeleteTarget(null);
          await projects.deleteProjectNode(id);
        }}
      />
    </>
  );
}
