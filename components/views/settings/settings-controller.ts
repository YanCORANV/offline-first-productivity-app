"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlanner } from "../../planner-provider";
import { isIOSDevice, isStandaloneMode, timezonesEquivalent, urlBase64ToUint8Array } from "./settings-controls";
import { mergeSettingsForm, type ServiceStatus } from "./settings-model";
import type { FragmentMinutes, PlannerSettings } from "@/lib/domain";

export function useSettingsController() {
  const {
    settings,
    saveSettings,
    removeItemType,
    conflicts,
    resolveConflict,
    resolveAllConflicts,
    fragmentActivities,
    addFragmentActivity,
    updateFragmentActivity,
    deleteFragmentActivity,
    notifications,
    markNotificationRead,
  } = usePlanner();
  const [form, setForm] = useState(settings);
  const previousSettingsRef = useRef(settings);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityMinutes, setActivityMinutes] = useState<FragmentMinutes[]>([15]);
  const [itemTypeName, setItemTypeName] = useState("");
  const [saved, setSaved] = useState("");
  const [conflictResolutionBusy, setConflictResolutionBusy] = useState(false);
  const detectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || settings.timezone,
    [settings.timezone],
  );
  const timezoneChanged = useMemo(
    () =>
      !timezonesEquivalent(detectedTimezone, form.timezone) &&
      form.lastTimezonePrompt !== detectedTimezone,
    [detectedTimezone, form.lastTimezonePrompt, form.timezone],
  );

  useEffect(() => {
    const previous = previousSettingsRef.current;
    previousSettingsRef.current = settings;
    setForm((current) => mergeSettingsForm(previous, current, settings));
  }, [settings]);

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then((data) => {
        const next = data as ServiceStatus;
        setStatus(next);
      })
      .catch(() =>
        setStatus({ cloud: "unconfigured", push: "unconfigured" }),
      );
  }, []);

  const isInitialMount = useRef(true);
  const formRef = useRef(form);
  const previousSavedSettingsRef = useRef(settings);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const currentSaved = previousSavedSettingsRef.current;
    const hasChanges = (
      form.defaultWakeTime !== currentSaved.defaultWakeTime ||
      form.defaultSleepTime !== currentSaved.defaultSleepTime ||
      form.calendarDisplayStart !== currentSaved.calendarDisplayStart ||
      form.calendarDisplayEnd !== currentSaved.calendarDisplayEnd ||
      form.timezone !== currentSaved.timezone ||
      form.inboxAgeHours !== currentSaved.inboxAgeHours ||
      JSON.stringify(form.itemTypes) !== JSON.stringify(currentSaved.itemTypes)
    );
    if (!hasChanges) return;

    const timer = window.setTimeout(async () => {
      try {
        const payload: Partial<PlannerSettings> = {
          defaultWakeTime: form.defaultWakeTime || currentSaved.defaultWakeTime,
          defaultSleepTime: form.defaultSleepTime || currentSaved.defaultSleepTime,
          calendarDisplayStart: form.calendarDisplayStart || currentSaved.calendarDisplayStart,
          calendarDisplayEnd: form.calendarDisplayEnd || currentSaved.calendarDisplayEnd,
          timezone: form.timezone,
          inboxAgeHours: form.inboxAgeHours,
          itemTypes: form.itemTypes,
        };
        previousSavedSettingsRef.current = { ...currentSaved, ...payload };
        await saveSettings(payload);
      } catch (err) {
        console.error("Auto-save settings failed:", err);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form, saveSettings]);

  useEffect(() => {
    previousSavedSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    return () => {
      const currentForm = formRef.current;
      const currentSaved = previousSavedSettingsRef.current;
      const hasChanges = (
        currentForm.defaultWakeTime !== currentSaved.defaultWakeTime ||
        currentForm.defaultSleepTime !== currentSaved.defaultSleepTime ||
        currentForm.calendarDisplayStart !== currentSaved.calendarDisplayStart ||
        currentForm.calendarDisplayEnd !== currentSaved.calendarDisplayEnd ||
        currentForm.timezone !== currentSaved.timezone ||
        currentForm.inboxAgeHours !== currentSaved.inboxAgeHours ||
        JSON.stringify(currentForm.itemTypes) !== JSON.stringify(currentSaved.itemTypes)
      );
      if (hasChanges) {
        void saveSettings({
          defaultWakeTime: currentForm.defaultWakeTime || currentSaved.defaultWakeTime,
          defaultSleepTime: currentForm.defaultSleepTime || currentSaved.defaultSleepTime,
          calendarDisplayStart: currentForm.calendarDisplayStart || currentSaved.calendarDisplayStart,
          calendarDisplayEnd: currentForm.calendarDisplayEnd || currentSaved.calendarDisplayEnd,
          timezone: currentForm.timezone,
          inboxAgeHours: currentForm.inboxAgeHours,
          itemTypes: currentForm.itemTypes,
        });
      }
    };
  }, [saveSettings]);

  async function save(patch: Partial<PlannerSettings> = form) {
    try {
      previousSavedSettingsRef.current = { ...previousSavedSettingsRef.current, ...patch };
      await saveSettings(patch);
      setSaved("设置已保存");
    } catch {
      setSaved("没有保存成功，请重试");
    }
  }

  async function removeType(id: string) {
    try {
      if (settings.itemTypes.some((type) => type.id === id)) await removeItemType(id);
      setForm((current) => ({ ...current, itemTypes: current.itemTypes.filter((type) => type.id !== id) }));
    } catch {
      setSaved("没有删除成功，请重试");
    }
  }

  const [checkingServices, setCheckingServices] = useState(false);

  async function checkServicesStatus() {
    setCheckingServices(true);
    try {
      const response = await fetch("/api/status");
      const next = (await response.json()) as ServiceStatus;
      setStatus(next);
      return next;
    } catch {
      const fallback: ServiceStatus = { cloud: "unconfigured", push: "unconfigured" };
      setStatus(fallback);
      return fallback;
    } finally {
      setCheckingServices(false);
    }
  }

  async function enableNotifications() {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      const isIOS = isIOSDevice();
      const isStandalone = isStandaloneMode();
      if (isIOS && !isStandalone) {
        setNotificationMessage("iPhone / iPad 请先在 Safari 中点击底部「分享」按钮选择「添加到主屏幕」，从桌面图标打开应用后再进入设置点击授权。");
        await saveSettings({ notificationState: "unsupported" });
        return;
      }
      if (typeof window === "undefined" || !("Notification" in window)) {
        setNotificationMessage("当前浏览器或系统环境不支持桌面通知。");
        await saveSettings({ notificationState: "unsupported" });
        return;
      }
      const permission = await Notification.requestPermission();
      await saveSettings({ notificationState: permission });
      if (permission !== "granted") {
        setNotificationMessage("系统通知权限未被开启。请在系统设置或浏览器网站设置中允许通知。");
        return;
      }

      // 触发一条测试通知确认连通
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          void navigator.serviceWorker.ready.then((reg) => {
            void reg.showNotification("Quiet Plan 提醒测试", {
              body: "系统通知与提醒已连通，将准时为您推送日程提醒。",
              icon: "/favicon.svg",
              tag: "test-notification",
            });
          });
        } else {
          new Notification("Quiet Plan 提醒测试", {
            body: "系统通知与提醒已连通，将准时为您推送日程提醒。",
            icon: "/favicon.svg",
          });
        }
      } catch {
        // Safe fallback
      }

      // 若服务端已配置 Web Push，则同时注册设备推送
      if (status?.push === "connected" && "serviceWorker" in navigator) {
        try {
          const keyResponse = await fetch("/api/push/public-key");
          if (keyResponse.ok) {
            const { publicKey } = (await keyResponse.json()) as { publicKey: string };
            const swRegistration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ]);
            if (swRegistration && "pushManager" in swRegistration) {
              const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
              });
              const response = await fetch("/api/push/subscriptions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  subscription: subscription.toJSON(),
                  timezone: detectedTimezone,
                  userAgent: navigator.userAgent,
                }),
              });
              if (response.ok) {
                setNotificationMessage("系统通知与设备后台推送已全部连接开启！已发送测试提醒。");
                return;
              }
            }
          }
        } catch (pushErr) {
          console.warn("Web Push registration error:", pushErr);
        }
      }
      setNotificationMessage("系统通知权限已开启！已发送测试提醒。");
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : "通知权限请求失败");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function addActivity() {
    if (!activityTitle.trim() || !activityMinutes.length) return;
    await addFragmentActivity(activityTitle, activityMinutes);
    setActivityTitle("");
  }

  function confirmTimezone() {
    setForm((current) => ({
      ...current,
      timezone: detectedTimezone,
      lastTimezonePrompt: detectedTimezone,
    }));
  }

  async function keepAllLocalConflicts() {
    if (!conflicts.length || conflictResolutionBusy) return;
    setConflictResolutionBusy(true);
    try {
      const count = await resolveAllConflicts("local");
      setSaved(count ? `已保留 ${count} 个本机修改` : "没有待处理冲突");
    } catch {
      setSaved("冲突处理失败，未完成批量修改");
    } finally {
      setConflictResolutionBusy(false);
    }
  }

  return {
    settings,
    form,
    setForm,
    status,
    notificationMessage,
    notificationBusy,
    activityTitle,
    activityMinutes,
    itemTypeName,
    saved,
    detectedTimezone,
    timezoneChanged,
    conflicts,
    fragmentActivities,
    notifications,
    save,
    saveItemTypes: () => save({ itemTypes: form.itemTypes }),
    enableNotifications,
    addActivity,
    removeItemType: removeType,
    confirmTimezone,
    setNotificationMessage,
    setActivityTitle,
    setActivityMinutes,
    setItemTypeName,
    updateFragmentActivity,
    deleteFragmentActivity,
    markNotificationRead,
    resolveConflict,
    keepAllLocalConflicts,
    conflictResolutionBusy,
    checkServicesStatus,
    checkingServices,
  };
}
