import { Check, Lightbulb, ListTodo } from "lucide-react";
import { CalendarPopover } from "./calendar-popover";
import { EmptyState } from "../../ui";
import type { PlannerTask, ProjectNode, QuickThought } from "@/lib/domain";
import { setDragPayload } from "./calendar-grid";

export type CalendarCandidate =
  | { kind: "task"; item: PlannerTask; caption: string }
  | { kind: "node"; item: ProjectNode; caption: string }
  | { kind: "thought"; item: QuickThought; caption: string };

export function CandidatePool({
  candidates,
  limit,
  busyId,
  targetTaskId,
  targetNodeId,
  onLimitChange,
  onOpen,
  onDelete,
}: {
  candidates: CalendarCandidate[];
  limit: number;
  busyId: string | null;
  targetTaskId?: string;
  targetNodeId?: string;
  onLimitChange: (limit: number) => void;
  onOpen: (candidate: CalendarCandidate) => void;
  onDelete: (candidate: CalendarCandidate) => void;
}) {
  return (
    <CalendarPopover name={`待落实 ${candidates.length}`} openKey={targetTaskId || targetNodeId}
      label={<><span>待落实</span><span className="candidate-count">{candidates.length}</span></>}>
      <section className="unscheduled-panel candidate-pool">
      <div className="candidate-list">
        {candidates.length ? (
          candidates.map((candidate) => {
            const candidateId = `${candidate.kind}-${candidate.item.id}`;
            const isTarget =
              (candidate.kind === "task" && candidate.item.id === targetTaskId) ||
              (candidate.kind === "node" && candidate.item.id === targetNodeId);
            return (
              <div
                key={candidateId}
                className={[
                  "unscheduled-item",
                  isTarget ? "is-target" : "",
                  busyId === candidateId ? "is-busy" : "",
                ].filter(Boolean).join(" ")}
              >
                <button
                  className="candidate-open-button"
                  data-close-popover
                  type="button"
                  draggable
                  disabled={busyId !== null}
                  onDragStart={(event) =>
                    setDragPayload(event, { kind: candidate.kind, id: candidate.item.id })
                  }
                  onClick={() => onOpen(candidate)}
                >
                  {candidate.kind === "thought" ? <Lightbulb size={14} /> : <ListTodo size={14} />}
                  <span>
                    <strong>
                      {busyId === candidateId
                        ? "正在准备事项…"
                        : candidate.kind === "thought"
                          ? candidate.item.content
                          : candidate.item.title}
                    </strong>
                    <small>{candidate.caption}</small>
                  </span>
                </button>
                <button
                  className="candidate-delete"
                  type="button"
                  aria-label="删除待落实事项"
                  onClick={() => onDelete(candidate)}
                >
                  ×
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState icon={<Check size={18} />} title="没有待落实内容" />
        )}
      </div>
      </section>
    </CalendarPopover>
  );
}
