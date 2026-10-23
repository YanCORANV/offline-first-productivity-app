export interface TimelineInterval {
  startAt: string;
  endAt: string;
}

export interface TimelineWindow {
  start: Date;
  end: Date;
  totalMinutes: number;
}

export function resolveTimelineWindow(
  date: Date,
  displayStart: string,
  displayEnd: string,
  intervals: TimelineInterval[] = [],
): TimelineWindow {
  const atClock = (clock: string) => {
    const [hour, minute] = clock.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hour, minute, 0, 0);
    return result;
  };
  const configuredStart = atClock(displayStart);
  const configuredEnd = atClock(displayEnd);
  if (configuredEnd <= configuredStart) configuredEnd.setDate(configuredEnd.getDate() + 1);
  let start = configuredStart;
  let end = configuredEnd;
  for (const interval of intervals) {
    const intervalStart = new Date(interval.startAt);
    const intervalEnd = new Date(interval.endAt);
    if (Number.isNaN(intervalStart.getTime()) || Number.isNaN(intervalEnd.getTime())) continue;
    if (intervalStart < start) start = intervalStart;
    if (intervalEnd > end) end = intervalEnd;
  }
  return {
    start,
    end,
    totalMinutes: Math.max(1, (end.getTime() - start.getTime()) / 60_000),
  };
}

export function timelineOffsetMinutes(value: string | Date, window: TimelineWindow): number {
  const date = value instanceof Date ? value : new Date(value);
  return (date.getTime() - window.start.getTime()) / 60_000;
}

export interface CompactTimelineSegment {
  startMinute: number;
  endMinute: number;
  top: number;
  height: number;
  isGap: boolean;
}

export interface CompactTimelineScale {
  startMinute: number;
  endMinute: number;
  height: number;
  segments: CompactTimelineSegment[];
}

/** Calendar uses the exact display window selected in Settings. */
export function buildCalendarTimelineScale(
  startMinute: number,
  endMinute: number,
  pixelsPerTwoHours = 56,
): { scale: CompactTimelineScale; markerMinutes: number[] } {
  const safeEnd = Math.max(startMinute + 120, endMinute);
  const height = ((safeEnd - startMinute) / 120) * pixelsPerTwoHours;
  const scale: CompactTimelineScale = {
    startMinute,
    endMinute: safeEnd,
    height,
    segments: [
      {
        startMinute,
        endMinute: safeEnd,
        top: 0,
        height,
        isGap: false,
      },
    ],
  };
  const markerMinutes: number[] = [];
  for (let minute = startMinute; minute <= safeEnd; minute += 120) {
    markerMinutes.push(minute);
  }
  if (markerMinutes.at(-1) !== safeEnd) markerMinutes.push(safeEnd);
  return { scale, markerMinutes };
}

/**
 * Keeps event duration spatially meaningful while collapsing long empty
 * stretches into a clearly labelled gap. The result remains reversible so
 * Calendar drag/drop can keep its 15-minute precision.
 */
export function buildCompactTimelineScale(
  startMinute: number,
  endMinute: number,
  occupied: Array<{ startMinute: number; endMinute: number }>,
  hourHeight: number,
  gapThresholdMinutes = 20,
): CompactTimelineScale {
  const safeEnd = Math.max(startMinute + 1, endMinute);
  const merged = occupied
    .map((interval) => ({
      startMinute: Math.max(startMinute, Math.min(safeEnd, interval.startMinute)),
      endMinute: Math.max(startMinute, Math.min(safeEnd, interval.endMinute)),
    }))
    .filter((interval) => interval.endMinute > interval.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute)
    .reduce<Array<{ startMinute: number; endMinute: number }>>((result, interval) => {
      const previous = result.at(-1);
      if (!previous || interval.startMinute > previous.endMinute) {
        result.push({ ...interval });
      } else {
        previous.endMinute = Math.max(previous.endMinute, interval.endMinute);
      }
      return result;
    }, []);

  const rawSegments: Array<{
    startMinute: number;
    endMinute: number;
    isGap: boolean;
  }> = [];
  let cursor = startMinute;
  for (const interval of merged) {
    if (interval.startMinute > cursor) {
      rawSegments.push({
        startMinute: cursor,
        endMinute: interval.startMinute,
        isGap: true,
      });
    }
    rawSegments.push({ ...interval, isGap: false });
    cursor = interval.endMinute;
  }
  if (cursor < safeEnd) {
    rawSegments.push({ startMinute: cursor, endMinute: safeEnd, isGap: true });
  }
  if (!rawSegments.length) {
    rawSegments.push({
      startMinute,
      endMinute: safeEnd,
      isGap: true,
    });
  }

  let top = 0;
  const segments = rawSegments.map((segment) => {
    const duration = segment.endMinute - segment.startMinute;
    const naturalHeight = duration / 60 * hourHeight;
    const height =
      segment.isGap && duration > gapThresholdMinutes
        ? Math.min(54, Math.max(34, 30 + Math.log2(duration / gapThresholdMinutes) * 6))
        : segment.isGap
          ? naturalHeight
          : Math.max(28, naturalHeight);
    const result = { ...segment, top, height };
    top += height;
    return result;
  });

  return {
    startMinute,
    endMinute: safeEnd,
    height: top,
    segments,
  };
}

export function compactTimelineY(minute: number, scale: CompactTimelineScale): number {
  const clamped = Math.max(scale.startMinute, Math.min(scale.endMinute, minute));
  const segment =
    scale.segments.find(
      (candidate) => clamped >= candidate.startMinute && clamped <= candidate.endMinute,
    ) ?? scale.segments.at(-1);
  if (!segment) return 0;
  const duration = Math.max(1, segment.endMinute - segment.startMinute);
  return segment.top + ((clamped - segment.startMinute) / duration) * segment.height;
}

export function compactTimelineMinuteAtY(y: number, scale: CompactTimelineScale): number {
  const clamped = Math.max(0, Math.min(scale.height, y));
  const segment =
    scale.segments.find(
      (candidate) => clamped >= candidate.top && clamped <= candidate.top + candidate.height,
    ) ?? scale.segments.at(-1);
  if (!segment) return scale.startMinute;
  const ratio = segment.height ? (clamped - segment.top) / segment.height : 0;
  return segment.startMinute + ratio * (segment.endMinute - segment.startMinute);
}

export function formatGapDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
