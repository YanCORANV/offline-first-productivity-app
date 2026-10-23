import { useState, type FormEvent } from "react";
import { Lightbulb } from "lucide-react";
import { usePlanner } from "../planner-provider";

export function QuickCapture({
  compact = false,
  autoFocus = false,
  onSaved,
}: {
  compact?: boolean;
  autoFocus?: boolean;
  onSaved?: () => void;
}) {
  const { addThought, syncState } = usePlanner();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = value.trim();
    if (!content || saving) return;
    setSaving(true);
    setError("");
    try {
      await addThought(content);
      setValue("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
      onSaved?.();
    } catch {
      setError("没有保存成功，请再试一次。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={`quick-capture ${compact ? "is-compact" : ""}`} onSubmit={submit}>
      <div className="quick-capture-icon" aria-hidden="true">
        <Lightbulb size={18} strokeWidth={1.8} />
      </div>
      <label className="sr-only" htmlFor={compact ? "quick-thought-compact" : "quick-thought"}>
        记录一个想法
      </label>
      <input
        id={compact ? "quick-thought-compact" : "quick-thought"}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="刚刚想到什么？"
        autoComplete="off"
      />
      <button className="quiet-button primary-quiet" disabled={!value.trim() || saving} type="submit">
        {saving ? "保存中" : saved ? "已保存" : "保存"}
      </button>
      {!compact && (syncState === "offline" || syncState === "unconfigured") ? (
        <span className="capture-hint">会先保存在此设备</span>
      ) : null}
      {error ? <span className="capture-error" role="alert">{error}</span> : null}
    </form>
  );
}
