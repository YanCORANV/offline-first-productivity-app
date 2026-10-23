"use client";

import { useEffect, useRef } from "react";
import {
  eventOccurrenceOnDay,
  localDateKey,
  type CalendarEvent,
  type PlannerSettings,
  type PlannerTask,
  type ProjectNode,
  type ScheduleBlock,
} from "@/lib/domain";
import { taskTitleForBlock } from "@/lib/planning";

interface WidgetTaskItem {
  id: string;
  title: string;
  startTime: string | null;
  dueTime: string | null;
  status: string;
  color: string | null;
}

const BRIDGE_ENDPOINT = "http://127.0.0.1:23579/api/widget-sync";

export function useWidgetBridge({
  ready,
  tasks,
  events,
  scheduleBlocks,
  projectNodes,
  settings,
}: {
  ready: boolean;
  tasks: PlannerTask[];
  events: CalendarEvent[];
  scheduleBlocks: ScheduleBlock[];
  projectNodes: ProjectNode[];
  settings: PlannerSettings;
}) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;

    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const colorMap = new Map(settings.itemTypes.map((type) => [type.id, type.color]));
        const items: WidgetTaskItem[] = [];

        // 1. Tasks
        for (const task of tasks) {
          if (task.status === "deleted") continue;
          const start = task.scheduledStartAt ?? null;
          const due = task.dueAt ?? null;
          if (!start && !due) continue;
          items.push({
            id: task.id,
            title: task.title,
            startTime: start,
            dueTime: due,
            status: task.status,
            color: task.colorOverride || colorMap.get(task.itemTypeId) || "#AFC3D4",
          });
        }

        // 2. Events (including recurrence expansion across -15 to +45 days)
        const now = new Date();
        const startDay = new Date(now);
        startDay.setDate(startDay.getDate() - 15);
        startDay.setHours(0, 0, 0, 0);

        const endDay = new Date(now);
        endDay.setDate(endDay.getDate() + 45);
        endDay.setHours(23, 59, 59, 999);

        for (const event of events) {
          if (event.status === "completed") {
            const eventStart = new Date(event.startAt);
            if (eventStart >= startDay && eventStart <= endDay) {
              items.push({
                id: event.id,
                title: event.title,
                startTime: event.startAt,
                dueTime: event.endAt,
                status: "completed",
                color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC",
              });
            }
            continue;
          }

          const durationMs =
            new Date(event.endAt).getTime() - new Date(event.startAt).getTime();

          if (event.recurrenceRule) {
            const cursor = new Date(startDay);
            while (cursor <= endDay) {
              const occ = eventOccurrenceOnDay(event, cursor);
              if (occ) {
                const occEnd = new Date(new Date(occ).getTime() + durationMs).toISOString();
                items.push({
                  id: `${event.id}_${localDateKey(cursor)}`,
                  title: event.title,
                  startTime: occ,
                  dueTime: occEnd,
                  status: "open",
                  color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC",
                });
              }
              cursor.setDate(cursor.getDate() + 1);
            }
          } else {
            items.push({
              id: event.id,
              title: event.title,
              startTime: event.startAt,
              dueTime: event.endAt,
              status: event.status,
              color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC",
            });
          }
        }

        // 3. Schedule Blocks
        for (const block of scheduleBlocks) {
          if (block.status === "skipped") continue;
          const start = block.startAt ?? `${block.date}T00:00:00.000Z`;
          const end = block.endAt ?? `${block.date}T23:59:59.000Z`;
          items.push({
            id: block.id,
            title: taskTitleForBlock(block, tasks, projectNodes),
            startTime: start,
            dueTime: end,
            status: block.status === "performed" ? "completed" : "open",
            color: "#AFC3D4",
          });
        }

        // Send to local companion daemon
        void fetch(BRIDGE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items),
        }).catch(() => {
          // Silently ignore if bridge is unreachable
        });
      } catch {
        // Silently ignore any payload preparation errors
      }
    }, 400);

    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [events, projectNodes, ready, scheduleBlocks, settings, tasks]);
}
