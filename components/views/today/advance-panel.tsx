import { ChevronRight, Moon, Sunrise, Trash2 } from "lucide-react";
import type { PlannerTask, ProjectNode } from "@/lib/domain";
import type { AdvanceCandidate } from "@/lib/planning";
import { buildGapSummary } from "./today-timeline";

export function AdvancePanel({
  targetDate,
  targetDateKey,
  sleepTime,
  freeRanges,
  tab,
  candidates,
  largestGap,
  onSleepTimeChange,
  onTabChange,
  onCandidate,
  onDelete,
}: {
  targetDate: Date;
  targetDateKey: string;
  sleepTime: string;
  freeRanges: Array<{ startAt: string; endAt: string; minutes: number }>;
  tab: "recommended" | "all";
  candidates: AdvanceCandidate[];
  largestGap: number;
  onSleepTimeChange: (time: string) => void;
  onTabChange: (tab: "recommended" | "all") => void;
  onCandidate: (source: PlannerTask | ProjectNode) => void;
  onDelete: (source: PlannerTask | ProjectNode) => Promise<void>;
}) {
  return (
    <section className="advance-panel">
      <header className="advance-panel-heading">
        <div>
          <h2>需要推进</h2>
          <time dateTime={targetDateKey}>{targetDate.getMonth() + 1} 月 {targetDate.getDate()} 日</time>
        </div>
        <label className="sleep-override">
          <Moon size={14} />
          <span>预计入睡</span>
          <input type="time" value={sleepTime} onChange={(event) => onSleepTimeChange(event.target.value)} />
        </label>
      </header>
      <div className="gap-summary"><Sunrise size={15} /><span>{buildGapSummary(freeRanges)}</span></div>
      <div className="advance-tabs segmented-control">
        <button type="button" className={tab === "recommended" ? "is-active" : ""} onClick={() => onTabChange("recommended")}>
          适合 {targetDate.getMonth() + 1}/{targetDate.getDate()}
        </button>
        <button type="button" className={tab === "all" ? "is-active" : ""} onClick={() => onTabChange("all")}>
          全部可推进
        </button>
      </div>
      <div className="advance-list">
        {candidates.length ? (
          candidates.map((candidate) => {
            const constraint = candidate.needsContinuousTime
              ? "连续时间"
              : candidate.isFragmentFriendly
                ? "碎片时间"
                : null;
            return (
              <div
                key={`${candidate.source.entityType}-${candidate.id}`}
                className="advance-candidate"
              >
                <button className="advance-candidate-main" type="button" onClick={() => onCandidate(candidate.source)}>
                  <span className="advance-candidate-copy"><strong>{candidate.title}</strong><small>{candidate.caption}</small></span>
                  <span className="advance-candidate-action" aria-hidden="true">
                    {constraint ? <small>{constraint}</small> : null}
                    <ChevronRight size={16} />
                  </span>
                </button>
                <button
                  className="advance-candidate-delete icon-button"
                  type="button"
                  aria-label={`永久删除${candidate.title}`}
                  onClick={() => {
                    if (window.confirm(`确定永久删除“${candidate.title}”吗？`)) void onDelete(candidate.source);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="advance-empty">
            {tab === "recommended"
              ? largestGap < 20
                ? "这一天没有达到 20 分钟的连续空档。"
                : "当前没有适合这些空档的事项；Project 步骤需先设为当前推进。"
              : "没有尚未安排的事项；Project 步骤需先设为当前推进。"}
          </div>
        )}
      </div>
    </section>
  );
}
