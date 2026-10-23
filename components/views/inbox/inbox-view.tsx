"use client";

import "./inbox.css";

import { useEffect, useMemo, useState } from "react";
import { Undo2, X } from "lucide-react";
import { useAppNavigation } from "../../app-navigation";
import { usePlanner } from "../../planner-provider";
import { PageHeader, QuickCapture } from "../../ui";
import type { InboxProjectInput } from "./inbox-project-panel";
import { InboxItem } from "./inbox-item";

type Notice = {
  text: string;
  thoughtId?: string;
  taskId?: string;
  kind?: "convert" | "delete";
};

export function InboxView() {
  const {
    thoughts,
    goals,
    convertThoughtToDraft,
    updateThoughtStatus,
    restoreThought,
    deleteTask,
    addGoal,
    addProject,
  } = usePlanner();
  const { navigate } = useAppNavigation();
  const [projectThoughtId, setProjectThoughtId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>({ text: "" });
  const [draftTaskId, setDraftTaskId] = useState("");

  const inbox = useMemo(
    () => thoughts.filter((thought) => thought.status === "inbox"),
    [thoughts],
  );
  const visibleGoals = useMemo(() => goals.filter((goal) => !goal.archived), [goals]);

  useEffect(() => {
    if (!notice.text) return;
    const timer = window.setTimeout(() => setNotice({ text: "" }), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function convertToTask(id: string) {
    setBusyId(id);
    try {
      const task = await convertThoughtToDraft(id);
      if (task) {
        setDraftTaskId(task.id);
        setNotice({ text: "已转为待落实事项。", thoughtId: id, taskId: task.id, kind: "convert" });
      }
    } catch {
      setNotice({ text: "未能保存这次处理，请重试。" });
    } finally {
      setBusyId(null);
    }
  }

  async function removeThought(id: string) {
    setBusyId(id);
    try {
      await updateThoughtStatus([id], "deleted", "已删除");
      setNotice({ text: "想法已删除。", thoughtId: id, kind: "delete" });
    } catch {
      setNotice({ text: "未能删除，请重试。" });
    } finally {
      setBusyId(null);
    }
  }

  async function undoNotice() {
    if (!notice.thoughtId) return;
    try {
      if (notice.kind === "convert" && notice.taskId) {
        await deleteTask(notice.taskId);
        await updateThoughtStatus([notice.thoughtId], "inbox", "已撤销事项转换");
        setNotice({ text: "已撤销，想法已回到 Inbox。" });
      } else {
        await restoreThought(notice.thoughtId);
        setNotice({ text: "已恢复到 Inbox。" });
      }
    } catch {
      setNotice({ text: "未能恢复，请重试。" });
    }
  }

  async function confirmProject(thoughtId: string, input: InboxProjectInput) {
    const projectThought = thoughts.find((thought) => thought.id === thoughtId);
    if (!projectThought || !input.goalName.trim() || !input.projectTitle.trim()) return;
    setBusyId(thoughtId);
    try {
      const goal = input.goalId
        ? visibleGoals.find((item) => item.id === input.goalId) ?? await addGoal(input.goalName.trim(), input.goalColor)
        : await addGoal(input.goalName.trim(), input.goalColor);
      const project = await addProject(goal.id, input.projectTitle.trim(), [projectThought.id]);
      await updateThoughtStatus([projectThought.id], "archived", "已开始 Project");
      setProjectThoughtId(null);
      navigate("projects", { projectId: project.id, initializeProject: true, returnTo: "inbox" });
    } catch {
      setNotice({ text: "未能创建 Project，请重试。" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {inbox.length ? (
        <div className="inbox-active-header">
          <PageHeader
            title="处理 Inbox"
            description={`${inbox.length} 条想法等待下一步。`}
            action={<div className="inbox-header-capture"><QuickCapture compact /></div>}
          />
        </div>
      ) : null}

      {notice.text ? (
        <div className="inbox-notice" role="status">
          <strong>{notice.text}</strong>
          <div className="inbox-notice-actions">
            {notice.kind === "convert" && draftTaskId ? <button type="button" onClick={() => navigate("calendar", { taskId: draftTaskId, openCandidates: true })}>去安排</button> : null}
            {notice.thoughtId ? <button type="button" onClick={() => void undoNotice()}><Undo2 size={14} />撤销</button> : null}
          </div>
          <button className="icon-button inbox-notice-close" type="button" onClick={() => setNotice({ text: "" })} aria-label="关闭提示"><X size={14} /></button>
        </div>
      ) : null}

      {inbox.length ? (
        <div className="inbox-list">
          {inbox.map((thought) => (
            <InboxItem
              key={thought.id}
              thought={thought}
              goals={visibleGoals}
              rowBusy={busyId === thought.id}
              projectOpen={projectThoughtId === thought.id}
              onConvert={() => void convertToTask(thought.id)}
              onBeginProject={() => setProjectThoughtId(thought.id)}
              onDelete={() => void removeThought(thought.id)}
              onCloseProject={() => setProjectThoughtId(null)}
              onConfirmProject={(input) => void confirmProject(thought.id, input)}
            />
          ))}
        </div>
      ) : (
        <section className="inbox-empty-entry" aria-label="记录 Inbox 想法"><QuickCapture compact autoFocus /></section>
      )}
    </>
  );
}
