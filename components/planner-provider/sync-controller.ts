import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { PlannerSettings, SyncOperation } from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import { synchronize, type SyncState } from "@/lib/sync-client";

export function useSyncController({
  ready,
  cloudEnabled,
  settingsRef,
}: {
  ready: boolean;
  cloudEnabled: boolean;
  settingsRef: RefObject<PlannerSettings>;
}) {
  const [syncState, setSyncState] = useState<SyncState>("starting");
  const [syncMessage, setSyncMessage] = useState("");
  const syncStateRef = useRef<SyncState>("starting");
  const syncing = useRef(false);
  const kickTimer = useRef<number | null>(null);

  const updateSyncStatus = useCallback((state: SyncState, message = "") => {
    syncStateRef.current = state;
    setSyncState((current) => current === state ? current : state);
    setSyncMessage((current) => current === message ? current : message);
  }, []);

  const runSync = useCallback(async (showProgress: boolean, reportSuccess: boolean) => {
    if (syncing.current || !ready) return;
    syncing.current = true;
    if (showProgress) {
      updateSyncStatus(navigator.onLine ? "syncing" : "offline");
    }
    try {
      const result = await synchronize(settingsRef.current);
      if (reportSuccess || result.state !== "synced" || syncStateRef.current !== "synced") {
        updateSyncStatus(
          result.state,
          result.state === "unconfigured"
            ? "云同步尚未连接，内容已安全保存在此设备"
            : result.message ?? "",
        );
      }
    } catch (error) {
      updateSyncStatus(
        "error",
        error instanceof Error ? error.message : "同步暂时不可用",
      );
    } finally {
      syncing.current = false;
    }
  }, [ready, settingsRef, updateSyncStatus]);

  const syncNow = useCallback(
    () => runSync(true, true),
    [runSync],
  );

  useEffect(() => {
    if (!ready) return;
    const initialSync = window.setTimeout(() => void runSync(false, true), 0);
    const onOnline = () => void runSync(false, false);
    const onOffline = () => updateSyncStatus("offline");
    const onVisibility = () => {
      if (document.visibilityState === "visible") void runSync(false, false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void runSync(false, false);
    }, 60_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(initialSync);
      window.clearInterval(interval);
    };
  }, [ready, runSync, updateSyncStatus]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutdatedDeployment = () => {
      const last = Number(sessionStorage.getItem("quiet_plan_last_chunk_reload") || 0);
      if (Date.now() - last > 8_000) {
        sessionStorage.setItem("quiet_plan_last_chunk_reload", String(Date.now()));
        window.location.reload();
      }
    };

    const onWorkerMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "PLANNER_SYNC_REQUESTED") {
        void runSync(false, false);
      } else if (event.data?.type === "DEPLOYMENT_CHUNK_MISSING") {
        handleOutdatedDeployment();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onWorkerMessage);
    }
    window.addEventListener("vite:preloadError", handleOutdatedDeployment);

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onWorkerMessage);
      }
      window.removeEventListener("vite:preloadError", handleOutdatedDeployment);
    };
  }, [runSync]);

  const enqueue = useCallback(async (operation: SyncOperation) => {
    const db = getPlannerDb();
    await db.operations.put(operation);
    if (
      cloudEnabled &&
      document.visibilityState !== "visible" &&
      "serviceWorker" in navigator &&
      "SyncManager" in window
    ) {
      void navigator.serviceWorker.ready
        .then((registration) =>
          (
            registration as ServiceWorkerRegistration & {
              sync: { register(tag: string): Promise<void> };
            }
          ).sync.register("planner-sync"),
        )
        .catch(() => {
          // Active-page synchronization remains available.
        });
    }
  }, [cloudEnabled]);

  const kickSync = useCallback(() => {
    if (kickTimer.current != null) window.clearTimeout(kickTimer.current);
    const runWhenIdle = () => {
      if (syncing.current) {
        kickTimer.current = window.setTimeout(runWhenIdle, 250);
        return;
      }
      kickTimer.current = null;
      void runSync(false, false);
    };
    kickTimer.current = window.setTimeout(runWhenIdle, 450);
  }, [runSync]);

  useEffect(() => () => {
    if (kickTimer.current != null) window.clearTimeout(kickTimer.current);
  }, []);

  return { syncState, syncMessage, syncNow, enqueue, kickSync };
}
