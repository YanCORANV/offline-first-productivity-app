"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function ServiceRow({
  icon,
  label,
  connected,
  loading,
  impact,
  instruction,
}: {
  icon: ReactNode;
  label: string;
  connected: boolean;
  loading: boolean;
  impact: string;
  instruction: string;
}) {
  return (
    <div className="service-detail-row">
      <div className="service-detail-heading">
        <span className="service-name">{icon}{label}</span>
        <span className={connected ? "service-status connected" : "service-status"}>
          {connected ? <CheckCircle2 size={13} /> : null}
          {loading ? "检查中" : connected ? "已连接" : "尚未连接"}
        </span>
      </div>
      <p>{impact}</p>
      {!loading && !connected ? <small>{instruction}</small> : null}
    </div>
  );
}

export function permissionLabel(permission: NotificationPermission | "unsupported" | "unknown") {
  if (permission === "granted") return "已允许";
  if (permission === "denied") return "已拒绝";
  if (permission === "unsupported") return "不支持";
  return "尚未请求";
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneMode(): boolean {
  if (typeof navigator !== "undefined" && "standalone" in navigator) {
    return Boolean((navigator as unknown as { standalone: boolean }).standalone);
  }
  if (typeof matchMedia === "function") {
    return matchMedia("(display-mode: standalone)").matches;
  }
  return false;
}

export function timezonesEquivalent(a: string, b: string) {
  if (a === b) return true;
  try {
    const years = [new Date(), new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 6, 15))];
    const signature = (zone: string) =>
      years
        .map((date) =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: zone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(date),
        )
        .join("|");
    return signature(a) === signature(b);
  } catch {
    return false;
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}
