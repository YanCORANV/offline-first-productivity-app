"use client";

import "./quick-actions-panel.css";

import { useMemo, useState } from "react";
import { useAppNavigation } from "./app-navigation";
import { usePlanner } from "./planner-provider";
import { QuickCapture } from "./ui";
import { QuickFocusSection } from "./quick-actions-focus";
import { buildQuickCandidates, type QuickCandidate, type QuickDuration } from "./quick-actions-model";

export function QuickActionsPanel({
  mode,
  onClose,
}: {
  mode: "capture" | "focus";
  onClose: () => void;
}) {
  const { tasks, thoughts, goals, projects, projectNodes, scheduleBlocks, fragmentActivities } = usePlanner();
  const { navigate } = useAppNavigation();
  const [duration, setDuration] = useState<QuickDuration | null>(null);
  const [message, setMessage] = useState("");
  const candidates = useMemo(
    () => buildQuickCandidates({ duration, tasks, thoughts, goals, projects, projectNodes, scheduleBlocks, fragmentActivities }),
    [duration, fragmentActivities, goals, projectNodes, projects, scheduleBlocks, tasks, thoughts],
  );

  function openCandidate(candidate: QuickCandidate) {
    if (candidate.kind === "task") {
      navigate("calendar", { taskId: candidate.id, openCandidates: true });
      onClose();
      return;
    }
    if (candidate.kind === "node") {
      navigate("calendar", { nodeId: candidate.id, openCandidates: true });
      onClose();
      return;
    }
    if (candidate.kind === "inbox") {
      navigate("today");
      onClose();
      return;
    }
    setMessage(`现在可以：${candidate.title}`);
  }

  return (
    <div className="quick-actions-panel">
      {mode === "capture" ? <section><QuickCapture autoFocus onSaved={onClose} /></section> : null}
      {mode === "focus" ? (
        <QuickFocusSection
          duration={duration}
          candidates={candidates}
          message={message}
          onDurationChange={(next) => {
            setDuration(next);
            setMessage("");
          }}
          onCandidate={openCandidate}
        />
      ) : null}
    </div>
  );
}
