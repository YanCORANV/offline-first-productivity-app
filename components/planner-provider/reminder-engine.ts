"use client";

import { useEffect, useRef } from "react";
import type { CalendarEvent, PlannerSettings, PlannerTask, ScheduleBlock } from "@/lib/domain";

interface ScheduledReminder {
  key: string;
  fireAtMs: number;
  title: string;
  body: string;
  url: string;
}

export function useReminderEngine({
  ready,
  tasks,
  events,
  scheduleBlocks,
  settings,
}: {
  ready: boolean;
  tasks: PlannerTask[];
  events: CalendarEvent[];
  scheduleBlocks: ScheduleBlock[];
  settings: PlannerSettings;
}) {
  const firedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ready || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    function checkReminders() {
      const now = Date.now();
      const remindersToSchedule: ScheduledReminder[] = [];

      // 1. Tasks
      for (const task of tasks) {
        if (task.status !== "open" || !task.reminderRules?.length) continue;
        const anchorTimeStr = task.scheduledStartAt || task.actualDeadlineAt || task.desiredCompletionAt || task.dueAt;
        if (!anchorTimeStr) continue;
        const anchorMs = new Date(anchorTimeStr).getTime();
        if (isNaN(anchorMs)) continue;

        for (const rule of task.reminderRules) {
          const offsetMs = (rule.offsetMinutes ?? 0) * 60_000;
          const fireAtMs = anchorMs - offsetMs;
          const key = `task_${task.id}_${rule.offsetMinutes}_${anchorMs}`;
          remindersToSchedule.push({
            key,
            fireAtMs,
            title: task.title || "任务提醒",
            body: rule.offsetMinutes > 0 ? `任务将在 ${rule.offsetMinutes} 分钟后开始/截止` : "任务现已到达安排时间",
            url: "/today",
          });
        }
      }

      // 2. Events
      for (const event of events) {
        if (event.status === "completed" || !event.reminderRules?.length) continue;
        const anchorTimeStr = event.startAt;
        if (!anchorTimeStr) continue;
        const anchorMs = new Date(anchorTimeStr).getTime();
        if (isNaN(anchorMs)) continue;

        for (const rule of event.reminderRules) {
          const offsetMs = (rule.offsetMinutes ?? 0) * 60_000;
          const fireAtMs = anchorMs - offsetMs;
          const key = `event_${event.id}_${rule.offsetMinutes}_${anchorMs}`;
          remindersToSchedule.push({
            key,
            fireAtMs,
            title: event.title || "日程提醒",
            body:
              rule.offsetMinutes > 0
                ? `${event.eventKind === "course" ? "课程" : event.eventKind === "exam" ? "考试" : "日程"}将在 ${rule.offsetMinutes} 分钟后开始`
                : "日程现已开始",
            url: "/calendar",
          });
        }
      }

      // 3. Schedule Blocks
      for (const block of scheduleBlocks) {
        if (block.status !== "planned" || !block.reminderRules?.length) continue;
        const anchorTimeStr = block.startAt || (block.date ? `${block.date}T09:00:00` : null);
        if (!anchorTimeStr) continue;
        const anchorMs = new Date(anchorTimeStr).getTime();
        if (isNaN(anchorMs)) continue;

        for (const rule of block.reminderRules) {
          const offsetMs = (rule.offsetMinutes ?? 0) * 60_000;
          const fireAtMs = anchorMs - offsetMs;
          const key = `block_${block.id}_${rule.offsetMinutes}_${anchorMs}`;
          remindersToSchedule.push({
            key,
            fireAtMs,
            title: "计划时间块提醒",
            body: rule.offsetMinutes > 0 ? `计划执行时间将在 ${rule.offsetMinutes} 分钟后开始` : "计划执行时间已到",
            url: "/calendar",
          });
        }
      }

      // Trigger notifications due in the window: past due up to 15 mins ago or within next 30s
      for (const r of remindersToSchedule) {
        if (firedKeysRef.current.has(r.key)) continue;

        const timeDiff = r.fireAtMs - now;
        // If fireAt is in the past (within 15 minutes) or <= 30 seconds away
        if (timeDiff <= 30_000 && timeDiff >= -900_000) {
          firedKeysRef.current.add(r.key);
          try {
            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(r.title, {
                  body: r.body,
                  icon: "/favicon.svg",
                  tag: r.key,
                  data: { url: r.url },
                });
              }).catch(() => {
                new Notification(r.title, {
                  body: r.body,
                  icon: "/favicon.svg",
                  tag: r.key,
                });
              });
            } else {
              new Notification(r.title, {
                body: r.body,
                icon: "/favicon.svg",
                tag: r.key,
              });
            }
          } catch (e) {
            console.warn("Notification trigger failed:", e);
          }
        }
      }
    }

    // Run check immediately and then every 20 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 20_000);

    return () => clearInterval(interval);
  }, [events, ready, scheduleBlocks, settings, tasks]);
}
