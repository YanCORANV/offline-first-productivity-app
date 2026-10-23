"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <OverlayShell className="modal" title={title} onClose={onClose}>
      {children}
    </OverlayShell>
  );
}

export function InspectorShell({
  title,
  onClose,
  panelClassName,
  backdropClassName,
  headerLeading,
  headerTrailing,
  children,
}: {
  title: string;
  onClose: () => void;
  panelClassName?: string;
  backdropClassName?: string;
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  children: React.ReactNode;
}) {
  return (
    <OverlayShell
      className="inspector"
      panelClassName={panelClassName}
      backdropClassName={backdropClassName}
      title={title}
      onClose={onClose}
      headerLeading={headerLeading}
      headerTrailing={headerTrailing}
    >
      <div className="inspector-body">{children}</div>
    </OverlayShell>
  );
}

function OverlayShell({
  className,
  panelClassName,
  backdropClassName,
  title,
  onClose,
  headerLeading,
  headerTrailing,
  children,
}: {
  className: "modal" | "inspector";
  panelClassName?: string;
  backdropClassName?: string;
  title: string;
  onClose: () => void;
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 47.9375rem)").matches;
    const focusTarget = isMobile
      ? panelRef.current?.querySelector<HTMLElement>(
          "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        )
      : panelRef.current?.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])",
        );
    focusTarget?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className={`${className}-backdrop overlay-backdrop${backdropClassName ? ` ${backdropClassName}` : ""}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={panelRef}
        className={`${className === "modal" ? "modal-card" : "inspector-panel"} overlay-panel${panelClassName ? ` ${panelClassName}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className={`modal-header ${className}-header`}>
          {headerLeading ? (
            <div className="modal-header-leading">{headerLeading}</div>
          ) : null}
          <h2>{title}</h2>
          {headerTrailing ? (
            <div className="modal-header-trailing">{headerTrailing}</div>
          ) : (
            <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          )}
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
