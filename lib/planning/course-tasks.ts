import type { PlannerTask } from "../domain.ts";

export interface CourseTaskSlot {
  startAt: string;
  durationMinutes: number | null;
}

export function nextCourseTaskSlot(
  courseStartAt: string,
  courseEndAt: string,
  tasks: Array<Pick<PlannerTask, "scheduledStartAt" | "durationMinutes">>,
): CourseTaskSlot {
  const courseStart = new Date(courseStartAt).getTime();
  const courseEnd = new Date(courseEndAt).getTime();
  let cursor = courseStart;

  for (const task of tasks) {
    if (!task.scheduledStartAt) continue;
    const taskStart = new Date(task.scheduledStartAt).getTime();
    if (taskStart < courseStart || taskStart >= courseEnd) continue;
    const taskEnd = taskStart + (task.durationMinutes ?? 0) * 60_000;
    cursor = Math.max(cursor, taskEnd);
  }

  if (cursor >= courseEnd) cursor = courseStart;
  const availableMinutes = Math.max(
    0,
    Math.floor((courseEnd - cursor) / 60_000),
  );
  return {
    startAt: new Date(cursor).toISOString(),
    durationMinutes: availableMinutes >= 5 ? Math.min(30, availableMinutes) : null,
  };
}
