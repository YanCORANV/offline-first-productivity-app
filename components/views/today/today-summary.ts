export function buildGapSummary(
  ranges: Array<{ startAt: string; endAt: string; minutes: number }>,
): string {
  if (!ranges.length) return "没有达到 20 分钟的连续空档";
  const largest = Math.max(...ranges.map((range) => range.minutes));
  const long = ranges.filter((range) => range.minutes >= 120).length;
  const short = ranges.length - long;
  const parts = [
    long ? `${long} 个长空档` : "",
    short ? `${short} 个短空档` : "",
    `最长 ${formatGapMinutes(largest)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function formatGapMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`;
}

export function buildTodaySummary(events: number, blocks: number, overdue: number): string {
  if (!events && !blocks && !overdue) return "今天没有必须完成的安排。";
  const parts: string[] = [];
  if (events) parts.push(`${events} 条固定事项`);
  if (blocks) parts.push(`${blocks} 个执行时间块`);
  if (overdue) parts.push(`${overdue} 项逾期`);
  return parts.join("，");
}
