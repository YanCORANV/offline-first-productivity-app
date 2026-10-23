import { useRef, type Dispatch, type SetStateAction } from "react";
import { Clock3, Globe, Inbox, Sun } from "lucide-react";
import type { PlannerSettings } from "@/lib/domain";

export type SettingsFormProps = {
  form: PlannerSettings;
  setForm: Dispatch<SetStateAction<PlannerSettings>>;
};

function getTimeSegmentCount(): number {
  if (typeof window === "undefined") return 3;
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).formatToParts(new Date());
    if (parts.some((p) => p.type === "dayPeriod")) return 3;
    const str = new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date());
    if (/am|pm|上午|下午/i.test(str)) return 3;
    return 2;
  } catch {
    return 3;
  }
}

export function ScheduleSettingsSection({
  form,
  setForm,
  onSave,
}: SettingsFormProps & { onSave?: (patch: Partial<PlannerSettings>) => Promise<void> }) {
  const segIndexRef = useRef<Record<string, number>>({});

  const handleKeyDown = (id: string, options: { nextId?: string; prevId?: string }) => {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      const maxSegs = getTimeSegmentCount();
      if (e.key === "ArrowRight") {
        const currentSeg = segIndexRef.current[id] ?? 0;
        if (currentSeg >= maxSegs - 1) {
          if (options.nextId) {
            e.preventDefault();
            document.getElementById(options.nextId)?.focus();
          }
        } else {
          segIndexRef.current[id] = currentSeg + 1;
        }
      } else if (e.key === "ArrowLeft") {
        const currentSeg = segIndexRef.current[id] ?? 0;
        if (currentSeg <= 0) {
          if (options.prevId) {
            e.preventDefault();
            document.getElementById(options.prevId)?.focus();
          }
        } else {
          segIndexRef.current[id] = currentSeg - 1;
        }
      } else if (e.key === "Enter") {
        if (options.nextId) {
          e.preventDefault();
          document.getElementById(options.nextId)?.focus();
        }
      }
    };
  };

  const handleClick = (id: string) => {
    return (e: React.MouseEvent<HTMLInputElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const maxSegs = getTimeSegmentCount();
      if (maxSegs === 3) {
        segIndexRef.current[id] = ratio > 0.65 ? 2 : ratio > 0.35 ? 1 : 0;
      } else {
        segIndexRef.current[id] = ratio > 0.5 ? 1 : 0;
      }
    };
  };

  return (
    <div className="settings-column-group">
      {/* Card 1: 时间 */}
      <section className="settings-card schedule-settings-card">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon-badge">
              <Clock3 size={18} />
            </div>
            <div className="settings-card-title-group">
              <h2>时间</h2>
            </div>
          </div>
        </div>

        <div className="settings-schedule-content">
          <div className="settings-apple-rows">
            {/* Row 1: 作息 */}
            <div className="settings-apple-row">
              <div className="settings-row-lead">
                <Sun size={17} className="settings-row-icon" />
                <span className="settings-lead-title">作息</span>
              </div>
              <div className="settings-row-pair-controls">
                <div className="settings-inline-time-field">
                  <span className="settings-sub-label">起床</span>
                  <div className="settings-time-input-wrap">
                    <input
                      id="settings-wake-time"
                      type="time"
                      className="apple-setting-time-input"
                      value={form.defaultWakeTime}
                      aria-label="起床时间"
                      onFocus={() => {
                        segIndexRef.current["wake"] = 0;
                      }}
                      onClick={handleClick("wake")}
                      onKeyDown={handleKeyDown("wake", {
                        nextId: "settings-sleep-time",
                      })}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val) {
                          setForm((current) => ({ ...current, defaultWakeTime: val }));
                        }
                      }}
                      onBlur={(event) => {
                        if (event.target.value) {
                          void onSave?.({ defaultWakeTime: event.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="settings-inline-time-field">
                  <span className="settings-sub-label">入睡</span>
                  <div className="settings-time-input-wrap">
                    <input
                      id="settings-sleep-time"
                      type="time"
                      className="apple-setting-time-input"
                      value={form.defaultSleepTime}
                      aria-label="入睡时间"
                      onFocus={() => {
                        segIndexRef.current["sleep"] = 0;
                      }}
                      onClick={handleClick("sleep")}
                      onKeyDown={handleKeyDown("sleep", {
                        prevId: "settings-wake-time",
                      })}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val) {
                          setForm((current) => ({ ...current, defaultSleepTime: val }));
                        }
                      }}
                      onBlur={(event) => {
                        if (event.target.value) {
                          void onSave?.({ defaultSleepTime: event.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: 时间轴 */}
            <div className="settings-apple-row">
              <div className="settings-row-lead">
                <Clock3 size={17} className="settings-row-icon" />
                <span className="settings-lead-title">时间轴</span>
              </div>
              <div className="settings-row-pair-controls">
                <div className="settings-inline-time-field">
                  <span className="settings-sub-label">开始</span>
                  <div className="settings-time-input-wrap">
                    <input
                      id="settings-calendar-start"
                      type="time"
                      className="apple-setting-time-input"
                      value={form.calendarDisplayStart}
                      aria-label="时间轴显示开始时间"
                      onFocus={() => {
                        segIndexRef.current["start"] = 0;
                      }}
                      onClick={handleClick("start")}
                      onKeyDown={handleKeyDown("start", {
                        nextId: "settings-calendar-end",
                      })}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val) {
                          setForm((current) => ({ ...current, calendarDisplayStart: val }));
                        }
                      }}
                      onBlur={(event) => {
                        if (event.target.value) {
                          void onSave?.({ calendarDisplayStart: event.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="settings-inline-time-field">
                  <span className="settings-sub-label">结束</span>
                  <div className="settings-time-input-wrap">
                    <input
                      id="settings-calendar-end"
                      type="time"
                      className="apple-setting-time-input"
                      value={form.calendarDisplayEnd}
                      aria-label="时间轴显示结束时间"
                      onFocus={() => {
                        segIndexRef.current["end"] = 0;
                      }}
                      onClick={handleClick("end")}
                      onKeyDown={handleKeyDown("end", {
                        prevId: "settings-calendar-start",
                      })}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val) {
                          setForm((current) => ({ ...current, calendarDisplayEnd: val }));
                        }
                      }}
                      onBlur={(event) => {
                        if (event.target.value) {
                          void onSave?.({ calendarDisplayEnd: event.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: 时区 */}
            <div className="settings-apple-row">
              <div className="settings-row-lead">
                <Globe size={17} className="settings-row-icon" />
                <span className="settings-lead-title">时区</span>
              </div>
              <div className="settings-row-select-wrap">
                <select
                  className="apple-setting-select settings-timezone-select"
                  value={form.timezone}
                  aria-label="时区"
                  onChange={(event) => {
                    const val = event.target.value;
                    setForm((current) => ({ ...current, timezone: val }));
                    void onSave?.({ timezone: val });
                  }}
                >
                  <option value={form.timezone}>{form.timezone}</option>
                  {form.timezone !== "Asia/Shanghai" && <option value="Asia/Shanghai">Asia/Shanghai</option>}
                  {form.timezone !== "America/Chicago" && <option value="America/Chicago">America/Chicago</option>}
                  {form.timezone !== "America/New_York" && <option value="America/New_York">America/New_York</option>}
                  {form.timezone !== "America/Los_Angeles" && <option value="America/Los_Angeles">America/Los_Angeles</option>}
                  {form.timezone !== "Europe/London" && <option value="Europe/London">Europe/London</option>}
                  {form.timezone !== "UTC" && <option value="UTC">UTC</option>}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: Inbox */}
      <section className="settings-card inbox-settings-card">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon-badge">
              <Inbox size={18} />
            </div>
            <div className="settings-card-title-group">
              <h2>Inbox</h2>
            </div>
          </div>
        </div>

        <div className="settings-apple-rows">
          <div className="settings-apple-row">
            <div className="settings-row-lead">
              <Clock3 size={17} className="settings-row-icon" />
              <span className="settings-lead-title">提醒时间</span>
            </div>
            <div className="settings-row-select-wrap">
              <select
                className="apple-setting-select settings-inbox-select"
                value={form.inboxAgeHours}
                aria-label="Inbox 超时提醒时间"
                onChange={(event) => {
                  const val = Number(event.target.value);
                  setForm((current) => ({ ...current, inboxAgeHours: val }));
                  void onSave?.({ inboxAgeHours: val });
                }}
              >
                <option value="24">24 小时</option>
                <option value="48">48 小时</option>
                <option value="72">3 天</option>
                <option value="168">7 天</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
