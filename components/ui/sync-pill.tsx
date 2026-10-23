import {
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { usePlanner } from "../planner-provider";

export function SyncPill() {
  const { syncState, syncMessage, syncNow, conflicts } = usePlanner();
  const config = {
    starting: { icon: LoaderCircle, label: "正在准备", className: "is-working" },
    syncing: { icon: RefreshCw, label: "同步中", className: "is-working" },
    synced: { icon: Cloud, label: "已同步", className: "is-synced" },
    offline: { icon: CloudOff, label: "离线保存", className: "is-offline" },
    unconfigured: { icon: CloudOff, label: "仅此设备", className: "is-offline" },
    error: { icon: CloudOff, label: "同步受阻", className: "is-error" },
  }[syncState];
  const Icon = config.icon;
  const title = conflicts.length
    ? `${conflicts.length} 项修改需要处理`
    : syncMessage || config.label;
  return (
    <button
      className={`sync-pill ${config.className}`}
      onClick={() => {
        if (syncState === "error" && syncMessage) {
          window.alert(`同步受阻信息：\n${syncMessage}`);
        }
        void syncNow();
      }}
      type="button"
      title={title}
    >
      <Icon size={14} className={syncState === "syncing" ? "spin" : ""} />
      <span>{conflicts.length ? `${conflicts.length} 个冲突` : config.label}</span>
    </button>
  );
}
