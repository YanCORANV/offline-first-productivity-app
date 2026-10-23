"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SettingsView } from "./settings-view";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="settings-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="settings-modal-window"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
      >
        <SettingsView onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
