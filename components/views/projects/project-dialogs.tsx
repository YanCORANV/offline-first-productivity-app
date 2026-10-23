import type { Goal, Project } from "@/lib/domain";
import { ModalShell } from "../../composers";

export function ProjectDialogs({
  deleteGoalTarget,
  currentProject,
  nodeDeleteTarget,
  endProjectOpen,
  deleteProjectOpen,
  deletingGoal,
  archivingProject,
  deletingProject,
  onCloseGoalDelete,
  onDeleteGoal,
  onCloseProjectEnd,
  onArchiveProject,
  onCloseProjectDelete,
  onDeleteProject,
  onCloseNodeDelete,
  onDeleteNode,
}: {
  deleteGoalTarget: Goal | null;
  currentProject: Project | null;
  nodeDeleteTarget: string | null;
  endProjectOpen: boolean;
  deleteProjectOpen: boolean;
  deletingGoal: boolean;
  archivingProject: boolean;
  deletingProject: boolean;
  onCloseGoalDelete: () => void;
  onDeleteGoal: () => Promise<void>;
  onCloseProjectEnd: () => void;
  onArchiveProject: () => Promise<void>;
  onCloseProjectDelete: () => void;
  onDeleteProject: () => Promise<void>;
  onCloseNodeDelete: () => void;
  onDeleteNode: (id: string) => Promise<unknown>;
}) {
  return (
    <>
      {deleteGoalTarget ? (
        <ModalShell title="删除 Goal" onClose={onCloseGoalDelete}>
          <div className="destructive-dialog">
            <p>“{deleteGoalTarget.name}”及其中的 Projects、节点和相关安排都会被删除。</p>
            <div>
              <button className="secondary-button" type="button" onClick={onCloseGoalDelete}>取消</button>
              <button className="danger-action is-confirm" type="button" disabled={deletingGoal} onClick={() => void onDeleteGoal()}>
                {deletingGoal ? "正在删除" : "确认删除"}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
      {endProjectOpen && currentProject ? (
        <ModalShell title="结束 Project" onClose={onCloseProjectEnd}>
          <div className="destructive-dialog">
            <p>结束后，“{currentProject.title}”会移到归档 Project。</p>
            <div>
              <button className="secondary-button" type="button" onClick={onCloseProjectEnd}>取消</button>
              <button className="primary-button" type="button" disabled={archivingProject} onClick={() => void onArchiveProject()}>
                {archivingProject ? "正在归档" : "结束并归档"}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
      {deleteProjectOpen && currentProject ? (
        <ModalShell title="删除 Project" onClose={onCloseProjectDelete}>
          <div className="destructive-dialog">
            <p>“{currentProject.title}”的全部节点和相关安排都会被删除。</p>
            <div>
              <button className="secondary-button" type="button" onClick={onCloseProjectDelete}>取消</button>
              <button className="danger-action is-confirm" type="button" disabled={deletingProject} onClick={() => void onDeleteProject()}>
                {deletingProject ? "正在删除" : "确认删除"}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
      {nodeDeleteTarget ? (
        <ModalShell title="删除步骤" onClose={onCloseNodeDelete}>
          <div className="destructive-dialog">
            <p>这个步骤及其全部子项会被删除，相关未来安排也会移除。</p>
            <div>
              <button className="secondary-button" type="button" onClick={onCloseNodeDelete}>保留</button>
              <button
                className="danger-action is-confirm"
                type="button"
                onClick={() => {
                  onCloseNodeDelete();
                  void onDeleteNode(nodeDeleteTarget);
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
