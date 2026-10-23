import { type Dispatch, SetStateAction } from "react";
import { Bell, BellRing, CalendarCheck, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { FragmentActivity, FragmentMinutes, PlannerSettings } from "@/lib/domain";
import { permissionLabel, isIOSDevice, isStandaloneMode } from "./settings-controls";
import type { ServiceStatus } from "./settings-model";

export function DeviceNotificationSection({
  settings,
  status,
  busy,
  message,
  onEnable,
}: {
  settings: PlannerSettings;
  status: ServiceStatus | null;
  busy: boolean;
  message: string;
  onEnable: () => Promise<void>;
}) {
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();
  const needsIosPwa = isIOS && !isStandalone;
  const localPermission = typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : undefined;
  const isPermissionGranted = localPermission ? localPermission === "granted" : settings.notificationState === "granted";
  const isPushConnected = status?.push === "connected";

  return (
    <section className="settings-card device-notification-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Bell size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>此设备的提醒</h2>
            <span className="settings-card-subtitle">管理本设备的系统通知与提醒服务</span>
          </div>
        </div>
      </div>

      <div className="settings-service-list">
        <div className="settings-service-item">
          <div className="settings-service-main">
            <div className="settings-service-icon-wrap">
              <BellRing size={18} />
            </div>
            <div className="settings-service-info">
              <div className="settings-service-title-row">
                <span className="settings-service-title">系统通知权限</span>
                <span className={`apple-status-pill ${needsIosPwa ? "is-idle" : isPermissionGranted ? "is-connected" : "is-idle"}`}>
                  <span className="apple-status-dot" aria-hidden="true" />
                  {needsIosPwa ? "需加到主屏" : isPermissionGranted ? "已开启" : permissionLabel(localPermission ?? settings.notificationState)}
                </span>
              </div>
              <span className="settings-service-desc">
                {needsIosPwa
                  ? "iPhone / iPad 必须先通过 Safari 添加到主屏幕，才能开启通知。"
                  : isPermissionGranted
                  ? "当前设备已允许 Quiet Plan 发送系统通知。"
                  : "在当前设备系统或浏览器中允许 Quiet Plan 发送通知。"}
              </span>
            </div>
          </div>
          <button
            className="secondary-button apple-service-action-btn"
            type="button"
            disabled={busy}
            onClick={() => void onEnable()}
          >
            {needsIosPwa ? "添加指引" : isPermissionGranted ? "测试提醒" : "去授权"}
          </button>
        </div>

        <div className="settings-service-item">
          <div className="settings-service-main">
            <div className="settings-service-icon-wrap">
              <CalendarCheck size={18} />
            </div>
            <div className="settings-service-info">
              <div className="settings-service-title-row">
                <span className="settings-service-title">提醒服务连接</span>
                <span className={`apple-status-pill ${isPushConnected ? "is-connected" : "is-idle"}`}>
                  <span className="apple-status-dot" aria-hidden="true" />
                  {isPushConnected ? "已连接" : "未连接"}
                </span>
              </div>
              <span className="settings-service-desc">
                {isPushConnected
                  ? "本设备的提醒服务已正常连接，可接收提醒。"
                  : "连接后台提醒服务后，关闭页面也可收到日程提醒。"}
              </span>
            </div>
          </div>
          <button
            className="secondary-button apple-service-action-btn"
            type="button"
            disabled={busy || !isPushConnected}
            onClick={() => void onEnable()}
          >
            {busy ? <LoaderCircle className="spin" size={14} /> : null}
            {isPushConnected ? "测试提醒" : "未连接"}
          </button>
        </div>
      </div>

      <div className="settings-footnote">
        iPhone / iPad：在 Safari 中点击「分享」按钮选择「添加到主屏幕」，从主屏幕图标打开应用后点击「去授权」；若需 iPhone 与 Mac 跨设备同步提醒，请先在上方配置云同步并在各设备分别授权。
      </div>
      {message ? <div className="settings-message">{message}</div> : null}
    </section>
  );
}

export function FragmentActivitiesSection({
  activities,
  title,
  minutes,
  onTitleChange,
  onMinutesChange,
  onAdd,
  onUpdate,
  onDelete,
}: {
  activities: FragmentActivity[];
  title: string;
  minutes: FragmentMinutes[];
  onTitleChange: (title: string) => void;
  onMinutesChange: Dispatch<SetStateAction<FragmentMinutes[]>>;
  onAdd: () => Promise<void>;
  onUpdate: (id: string, patch: Partial<FragmentActivity>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const options: FragmentMinutes[] = [15, 30, 60, 90];
  return (
    <section className="settings-card activity-settings-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Plus size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>碎片时间固定活动</h2>
            <span className="settings-card-subtitle">设置自由空隙推荐的默认活动与时长</span>
          </div>
        </div>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <div className="activity-row" key={activity.id}>
            <input
              type="checkbox"
              checked={activity.enabled}
              onChange={(event) => void onUpdate(activity.id, { enabled: event.target.checked })}
              aria-label={`启用 ${activity.title}`}
            />
            <input
              className="activity-title-input"
              defaultValue={activity.title}
              onBlur={(event) => {
                const nextTitle = event.currentTarget.value.trim();
                if (nextTitle && nextTitle !== activity.title) {
                  void onUpdate(activity.id, { title: nextTitle });
                }
              }}
              aria-label="活动名称"
            />
            <div className="activity-minute-options" aria-label={`${activity.title} 适用时段`}>
              {options.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={activity.eligibleMinutes.includes(value) ? "is-active" : ""}
                  onClick={() => {
                    const next = activity.eligibleMinutes.includes(value)
                      ? activity.eligibleMinutes.filter((item) => item !== value)
                      : [...activity.eligibleMinutes, value].sort((a, b) => a - b);
                    if (next.length) void onUpdate(activity.id, { eligibleMinutes: next });
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              className="activity-delete"
              type="button"
              onClick={() => void onDelete(activity.id)}
              aria-label={`删除 ${activity.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="inline-create activity-create">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="阅读、Podcast、休息…"
        />
        <div className="activity-minute-options">
          {options.map((value) => (
            <button
              key={value}
              type="button"
              className={minutes.includes(value) ? "is-active" : ""}
              onClick={() =>
                onMinutesChange((current) =>
                  current.includes(value)
                    ? current.length > 1
                      ? current.filter((item) => item !== value)
                      : current
                    : [...current, value].sort((a, b) => a - b),
                )
              }
            >
              {value}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void onAdd()} aria-label="新增碎片活动">
          <Plus size={15} />
        </button>
      </div>
    </section>
  );
}
