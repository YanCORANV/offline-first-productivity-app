import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  LoaderCircle,
  Monitor,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import type { MissedNotification, PlannerSettings, SyncConflict } from "@/lib/domain";
import { isIOSDevice, isStandaloneMode } from "./settings-controls";
import type { ServiceStatus } from "./settings-model";

export function ServicesSection({
  status,
  settings,
  notificationBusy,
  notificationMessage,
  onEnableNotifications,
  onCheckStatus,
  checkingServices,
}: {
  status: ServiceStatus | null;
  settings?: PlannerSettings;
  notificationBusy?: boolean;
  notificationMessage?: string;
  onEnableNotifications?: () => Promise<void>;
  onCheckStatus?: () => Promise<ServiceStatus | null>;
  checkingServices?: boolean;
}) {
  const [activeModal, setActiveModal] = useState<"cloud" | "push" | null>(null);
  const [copiedKey, setCopiedKey] = useState("");

  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();
  const needsIosPwa = isIOS && !isStandalone;
  const localPermission = typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : undefined;
  const isPermissionGranted = localPermission ? localPermission === "granted" : settings?.notificationState === "granted";
  const isCloudConnected = status?.cloud === "connected";
  const isPushConnected = status?.push === "connected";

  function copyText(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  }

  return (
    <section className="settings-card services-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Bell size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>通知与同步</h2>
          </div>
        </div>
        {onCheckStatus ? (
          <button
            type="button"
            className="apple-action-btn"
            style={{ width: "auto", padding: "0 8px", height: "1.75rem", fontSize: "11px" }}
            disabled={checkingServices}
            onClick={() => void onCheckStatus()}
            title="刷新服务状态"
          >
            <RefreshCw size={12} className={checkingServices ? "spin" : ""} />
            <span>{checkingServices ? "检测中…" : "刷新状态"}</span>
          </button>
        ) : null}
      </div>

      <div className="settings-apple-rows">
        {/* Row 1: 系统通知权限 */}
        <div className="settings-apple-row">
          <div className="settings-row-lead">
            <Monitor size={17} className="settings-row-icon" />
            <span className="settings-lead-title">系统通知权限</span>
          </div>
          <div className="settings-row-status-action">
            <span className={`apple-status-pill ${needsIosPwa ? "is-idle" : isPermissionGranted ? "is-connected" : "is-idle"}`}>
              {needsIosPwa ? "需加主屏" : isPermissionGranted ? "已授权" : "未授权"}
            </span>
            <button
              className="apple-action-btn"
              type="button"
              disabled={notificationBusy}
              onClick={() => void onEnableNotifications?.()}
            >
              {notificationBusy ? <LoaderCircle className="spin" size={13} /> : null}
              {needsIosPwa ? "添加指引" : isPermissionGranted ? "测试提醒" : "去授权"}
            </button>
          </div>
        </div>

        {/* Row 2: 离线后台提醒 */}
        <div className="settings-apple-row">
          <div className="settings-row-lead">
            <Send size={17} className="settings-row-icon" />
            <span className="settings-lead-title">离线后台提醒</span>
          </div>
          <div className="settings-row-status-action">
            <span className={`apple-status-pill ${isPushConnected ? "is-connected" : "is-idle"}`}>
              {isPushConnected ? "已连接" : "未连接"}
            </span>
            <button
              className="apple-action-btn"
              type="button"
              onClick={() => setActiveModal("push")}
            >
              {isPushConnected ? "查看" : "配置"}
            </button>
          </div>
        </div>

        {/* Row 3: 多设备同步 */}
        <div className="settings-apple-row">
          <div className="settings-row-lead">
            <Cloud size={17} className="settings-row-icon" />
            <span className="settings-lead-title">多设备云端同步</span>
          </div>
          <div className="settings-row-status-action">
            <span className={`apple-status-pill ${isCloudConnected ? "is-connected" : "is-idle"}`}>
              {isCloudConnected ? "已连接" : "未连接"}
            </span>
            <button
              className="apple-action-btn"
              type="button"
              onClick={() => setActiveModal("cloud")}
            >
              {isCloudConnected ? "查看" : "配置"}
            </button>
          </div>
        </div>
      </div>

      {notificationMessage ? <div className="settings-message">{notificationMessage}</div> : null}

      {/* 详细配置弹窗 */}
      {activeModal ? (
        <div className="service-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div
            className="service-modal-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="service-modal-header">
              <h3>
                {activeModal === "cloud" && "多设备云端同步配置"}
                {activeModal === "push" && "后台提醒与推送服务配置"}
              </h3>
              <button
                type="button"
                className="service-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="service-modal-body">
              {activeModal === "cloud" && (
                <>
                  <div className="service-modal-status-box">
                    <span>当前状态</span>
                    <span className={`apple-status-pill ${isCloudConnected ? "is-connected" : "is-idle"}`}>
                      {isCloudConnected ? "已连接并同步" : "尚未连接（未检测到 Supabase 配置）"}
                    </span>
                  </div>
                  <p>
                    多设备同步依托 <strong>Supabase</strong> 云端存储。配置后，在手机、电脑等任何设备上打开网页，数据均会自动实时双向同步。
                  </p>
                  <div>
                    <strong>在 Vercel 环境变量中配置：</strong>
                    <pre className="service-modal-code-block">
{`SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=<your-service-role-secret-key>`}
                    </pre>
                  </div>
                  <p>
                    <strong>数据库初始化：</strong>
                    本代码库已包含完整的 <code>supabase/migrations/</code> 迁移脚本。在 Supabase 项目控制台的 SQL Editor 中粘贴执行即可完成数据表与 RPC 函数部署。
                  </p>
                </>
              )}

              {activeModal === "push" && (
                <>
                  <div className="service-modal-status-box">
                    <span>当前状态</span>
                    <span className={`apple-status-pill ${isPushConnected ? "is-connected" : "is-idle"}`}>
                      {isPushConnected ? "后台推送已就绪（已内置开箱即用密钥）" : "未配置 Web Push 密钥"}
                    </span>
                  </div>
                  <p>
                    <strong>1. 本机系统通知：</strong>点击外层的“去授权”，浏览器即可直接显示当前网页的日程通知（完全免费，无需配置）。
                  </p>
                  <p>
                    <strong>2. 离线后台推送：</strong>系统已自动内置生产环境专属 VAPID 密钥，无需手动在 Vercel 填写！若需使用自定义密钥，可设置以下环境变量：
                  </p>
                  <div>
                    <strong>自定义 Vercel 环境变量（可选）：</strong>
                    <pre className="service-modal-code-block">
{`VAPID_PUBLIC_KEY=BGGQuW6FDiVVP29Civ6yi3vupDEp1OGFXK-kWL_z7PHHmNkaU5o7mrNTbTjyLU4IrSrYmIT5Jd_Gaq-mAVVsxa0
VAPID_PRIVATE_KEY=oaGbeCoAHg6YI21IheiOD83HSkdNjAQ_hPbEAYbtZ6A
VAPID_SUBJECT=mailto:2352335925@qq.com`}
                    </pre>
                  </div>
                </>
              )}
            </div>

            <div className="service-modal-footer">
              {activeModal === "cloud" && (
                <>
                  <button
                    type="button"
                    className="apple-action-btn"
                    onClick={() =>
                      copyText(
                        "SUPABASE_URL=https://your-project.supabase.co\nSUPABASE_SECRET_KEY=your-service-role-key",
                        "cloud",
                      )
                    }
                  >
                    {copiedKey === "cloud" ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === "cloud" ? "已复制变量名" : "复制变量名"}</span>
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={checkingServices}
                    onClick={() => void onCheckStatus?.()}
                  >
                    {checkingServices ? <LoaderCircle className="spin" size={13} /> : <RefreshCw size={13} />}
                    <span>重新检测连接</span>
                  </button>
                </>
              )}

              {activeModal === "push" && (
                <>
                  {!isPermissionGranted ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        void onEnableNotifications?.();
                        setActiveModal(null);
                      }}
                    >
                      <span>去开启系统通知权限</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setActiveModal(null)}
                  >
                    完成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function PendingNotificationsSection({
  notifications,
  onRead,
}: {
  notifications: MissedNotification[];
  onRead: (id: string) => Promise<void>;
}) {
  const unread = notifications.filter((notification) => !notification.readAt);
  if (!unread.length) return null;
  return (
    <section className="settings-card pending-notifications-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Bell size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>错过的提醒</h2>
            <span className="settings-card-subtitle">离线或未打开 PWA 时未能展示的提醒</span>
          </div>
        </div>
      </div>
      <div className="notification-list">
        {unread.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className="notification-item-btn"
            onClick={() => void onRead(notification.id)}
          >
            <span>
              <strong>{notification.title}</strong>
              <small>{notification.body}</small>
            </span>
            <CheckCircle2 size={15} />
          </button>
        ))}
      </div>
    </section>
  );
}

function renderConflictDetails(conflict: SyncConflict) {
  const local = conflict.localPatch || {};
  const server = conflict.serverRecord || {};

  // Special handling for settings (e.g. memoItems, itemTypes)
  if (conflict.entityType === "settings") {
    const localMemos = Array.isArray(local.memoItems) ? (local.memoItems as Array<{ id: string; content?: string }>) : null;
    const serverMemos = Array.isArray(server.memoItems) ? (server.memoItems as Array<{ id: string; content?: string }>) : null;

    if (localMemos || serverMemos) {
      const lCount = localMemos ? localMemos.length : 0;
      const sCount = serverMemos ? serverMemos.length : 0;
      const localSample = (localMemos || []).slice(0, 3).map((m) => m.content || m.id).join(", ");
      const serverSample = (serverMemos || []).slice(0, 3).map((m) => m.content || m.id).join(", ");

      return (
        <div className="conflict-diff-box">
          <div className="conflict-diff-field">
            <span className="conflict-diff-title">备忘录项目差异 (共 本机 {lCount} 条 / 云端 {sCount} 条):</span>
            <div className="conflict-diff-row">
              <span className="conflict-diff-tag local">本机版本:</span>
              <span className="conflict-diff-text">{localSample || "(无项目)"}{lCount > 3 ? ` 等共${lCount}条` : ""}</span>
            </div>
            <div className="conflict-diff-row">
              <span className="conflict-diff-tag server">云端版本:</span>
              <span className="conflict-diff-text">{serverSample || "(无项目)"}{sCount > 3 ? ` 等共${sCount}条` : ""}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  // General field diff
  const fields = conflict.conflictingFields.length
    ? conflict.conflictingFields
    : Object.keys(local).filter((key) => key in server && JSON.stringify(local[key]) !== JSON.stringify(server[key]));

  if (!fields.length) {
    return (
      <div className="conflict-diff-box">
        <small>冲突标识: {conflict.entityId}</small>
      </div>
    );
  }

  return (
    <div className="conflict-diff-box">
      {fields.slice(0, 4).map((field) => {
        const localVal = typeof local[field] === "object" ? JSON.stringify(local[field]) : String(local[field] ?? "—");
        const serverVal = typeof server[field] === "object" ? JSON.stringify(server[field]) : String(server[field] ?? "—");
        return (
          <div className="conflict-diff-field" key={field}>
            <span className="conflict-diff-title">字段 [{field}]:</span>
            <div className="conflict-diff-row">
              <span className="conflict-diff-tag local">本机:</span>
              <span className="conflict-diff-text">{localVal}</span>
            </div>
            <div className="conflict-diff-row">
              <span className="conflict-diff-tag server">云端:</span>
              <span className="conflict-diff-text">{serverVal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ConflictSettingsSection({
  conflicts,
  onResolve,
  onKeepAllLocal,
  busy,
}: {
  conflicts: SyncConflict[];
  onResolve: (id: string, resolution: "local" | "server") => Promise<void>;
  onKeepAllLocal: () => Promise<void>;
  busy: boolean;
}) {
  if (!conflicts.length) return null;
  return (
    <section className="settings-card conflict-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Cloud size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>多设备冲突 ({conflicts.length})</h2>
            <span className="settings-card-subtitle">其他设备与本机同时修改了相同数据，请选择要保留的版本</span>
          </div>
        </div>
        <button
          className="apple-action-btn"
          type="button"
          disabled={busy}
          onClick={() => void onKeepAllLocal()}
        >
          {busy ? <LoaderCircle className="spin" size={13} /> : null}
          全部保留本机
        </button>
      </div>

      <div className="conflict-list">
        {conflicts.map((conflict) => (
          <div className="conflict-item" key={conflict.id}>
            <div className="conflict-item-info">
              <div className="conflict-item-header">
                <strong>
                  {conflict.entityType === "settings"
                    ? "设置与备忘录"
                    : conflict.entityType === "thought"
                      ? "想法/收集箱"
                      : conflict.entityType === "task"
                        ? "任务"
                        : conflict.entityType === "event"
                          ? "日程"
                          : conflict.entityType}{" "}
                  发生冲突
                </strong>
                <span className="conflict-item-id">ID: {conflict.entityId}</span>
              </div>
              {renderConflictDetails(conflict)}
            </div>
            <div className="conflict-actions">
              <button
                type="button"
                className="conflict-action-local"
                disabled={busy}
                onClick={() => void onResolve(conflict.id, "local")}
              >
                保留本机
              </button>
              <button
                type="button"
                className="conflict-action-server"
                disabled={busy}
                onClick={() => void onResolve(conflict.id, "server")}
              >
                使用云端
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
