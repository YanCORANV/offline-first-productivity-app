import { useEffect, useId, useRef, type ReactNode } from "react";

/** Native light-dismiss, Escape and focus return; no second modal system. */
export function CalendarPopover({ label, name, children, openKey, className = "" }: {
  label: ReactNode;
  name: string;
  children: ReactNode;
  openKey?: string;
  className?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const position = () => {
    if (!trigger.current || !panel.current) return;
    const rect = trigger.current.getBoundingClientRect();
    panel.current.style.setProperty("--popover-top", `${rect.bottom + 8}px`);
    const width = Math.min(352, window.innerWidth - 24);
    const right = Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - width - 12));
    panel.current.style.setProperty("--popover-right", `${right}px`);
    panel.current.style.setProperty("--popover-height", `${Math.max(100, window.innerHeight - rect.bottom - 20)}px`);
  };
  useEffect(() => {
    const dismiss = () => panel.current?.hidePopover();
    window.addEventListener("resize", dismiss);
    return () => window.removeEventListener("resize", dismiss);
  }, []);
  useEffect(() => {
    if (openKey) {
      position();
      panel.current?.showPopover();
    }
  }, [openKey]);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight;
      if (!canScroll) {
        e.preventDefault();
        return;
      }
      const isAtTop = scrollTop <= 0 && e.deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);
  return (
    <>
      <button ref={trigger} type="button" className={`calendar-tool ${className}`} aria-label={name} popoverTarget={id} onClick={position}>
        {label}
      </button>
      <div ref={panel} id={id} popover="auto" className="calendar-toolbar-popover" aria-label={name}
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("[data-close-popover]")) panel.current?.hidePopover();
        }}
        onDragEnd={() => panel.current?.hidePopover()}
      >
        {children}
      </div>
    </>
  );
}
