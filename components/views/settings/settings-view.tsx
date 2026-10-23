"use client";

import "./settings.css";

import { MapPin, X } from "lucide-react";
import {
  ConflictSettingsSection,
  ItemTypesSettingsSection,
  PendingNotificationsSection,
  ScheduleSettingsSection,
  ServicesSection,
} from "./settings-sections";
import { useSettingsController } from "./settings-controller";

export function SettingsView({ onClose }: { onClose?: () => void }) {
  const controller = useSettingsController();

  return (
    <div className="settings-page">
      <div className="settings-window-header">
        <h1 className="settings-window-title">设置</h1>
        {onClose ? (
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="关闭设置"
            title="关闭"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {controller.saved ? (
        <div
          className={controller.saved.includes("没有") ? "inline-toast is-error" : "inline-toast"}
          role={controller.saved.includes("没有") ? "alert" : "status"}
        >
          {controller.saved}
        </div>
      ) : null}

      {controller.timezoneChanged ? (
        <div className="timezone-notice">
          <MapPin size={18} />
          <div>
            <strong>检测到新的设备时区：{controller.detectedTimezone}</strong>
            <p>一次性事项保持绝对时间；重复事项按当地钟表重算。</p>
          </div>
          <button type="button" onClick={controller.confirmTimezone}>确认切换</button>
        </div>
      ) : null}

      <div className="settings-grid">
        <div className="settings-col-left">
          <ScheduleSettingsSection
            form={controller.form}
            setForm={controller.setForm}
            onSave={controller.save}
          />
          <ServicesSection
            status={controller.status}
            settings={controller.settings}
            notificationBusy={controller.notificationBusy}
            notificationMessage={controller.notificationMessage}
            onEnableNotifications={controller.enableNotifications}
            onCheckStatus={controller.checkServicesStatus}
            checkingServices={controller.checkingServices}
          />
        </div>

        <div className="settings-col-right">
          <ItemTypesSettingsSection
            form={controller.form}
            setForm={controller.setForm}
            itemTypeName={controller.itemTypeName}
            onItemTypeNameChange={controller.setItemTypeName}
            onRemove={controller.removeItemType}
          />
          <PendingNotificationsSection
            notifications={controller.notifications}
            onRead={controller.markNotificationRead}
          />
          <ConflictSettingsSection
            conflicts={controller.conflicts}
            onResolve={controller.resolveConflict}
            onKeepAllLocal={controller.keepAllLocalConflicts}
            busy={controller.conflictResolutionBusy}
          />
        </div>
      </div>
    </div>
  );
}
