export type QuickTaskRow = {
  id: string;
  title: string;
  completed: boolean;
};

export function quickTaskEntries(rows: QuickTaskRow[]) {
  return rows
    .map((row) => ({ title: row.title.trim(), completed: row.completed }))
    .filter((row) => row.title.length > 0);
}

// Preserve text before/after the selection while splitting pasted lines.
export function splitQuickTaskText(
  title: string,
  start: number,
  end: number,
  inserted: string,
): string[] {
  return `${title.slice(0, start)}${inserted}${title.slice(end)}`.split(/\r\n|\r|\n/);
}
