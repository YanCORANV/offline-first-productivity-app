import { useLayoutEffect, useRef, useState } from "react";

/** Measure layout space, not scroll position; never rescale while scrolling. */
export function useCalendarTimelineHeight(active: boolean) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!active || !timelineRef.current) return;
    const timeline = timelineRef.current;
    const page = timeline.closest<HTMLElement>(".page-container");
    const workspace = timeline.closest<HTMLElement>(".calendar-page-layout");
    let frame = 0;
    const measure = () => {
      const top = timeline.getBoundingClientRect().top + window.scrollY;
      const bottomSpace = page ? parseFloat(getComputedStyle(page).paddingBottom) : 16;
      const next = Math.max(80, Math.floor(window.innerHeight - top - bottomSpace - 2));
      setAvailableHeight((previous) => previous === next ? previous : next);
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(scheduleMeasure);
    if (workspace) observer.observe(workspace);
    if (page) observer.observe(page);
    observer.observe(timeline);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [active]);

  return { timelineRef, availableHeight };
}
