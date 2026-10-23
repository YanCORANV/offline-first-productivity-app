import { ArrowRight, Timer } from "lucide-react";
import { DURATION_OPTIONS, type QuickCandidate, type QuickDuration } from "./quick-actions-model";

export function QuickFocusSection({
  duration,
  candidates,
  message,
  onDurationChange,
  onCandidate,
}: {
  duration: QuickDuration | null;
  candidates: QuickCandidate[];
  message: string;
  onDurationChange: (duration: QuickDuration) => void;
  onCandidate: (candidate: QuickCandidate) => void;
}) {
  return (
    <section className="quick-focus-section">
      <header>
        <Timer size={18} />
        <div>
          <strong>这段时间适合做什么？</strong>
          <small>直接选择可用时长。</small>
        </div>
      </header>
      <div className="duration-pills">
        {DURATION_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={duration === minutes ? "is-active" : ""}
            onClick={() => onDurationChange(minutes)}
          >
            {minutes} 分钟
          </button>
        ))}
      </div>
      {duration ? (
        <div className="quick-focus-results" key={duration}>
          {candidates.map((candidate) => (
            <button key={`${candidate.kind}-${candidate.id}`} type="button" onClick={() => onCandidate(candidate)}>
              <span><strong>{candidate.title}</strong><small>{candidate.caption}</small></span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      ) : null}
      {message ? <p className="inline-note" role="status">{message}</p> : null}
    </section>
  );
}
