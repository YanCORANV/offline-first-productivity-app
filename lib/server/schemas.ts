import { z } from "zod";

export const syncOperationSchema = z.object({
  id: z.string().min(1).max(160),
  entityType: z.enum([
    "thought",
    "task",
    "event",
    "goal",
    "project",
    "projectNode",
    "scheduleBlock",
    "phase",
    "fragmentActivity",
    "notification",
    "originLink",
    "aiRun",
    "settings",
    "pushSubscription",
  ]),
  entityId: z.string().min(1).max(160),
  action: z.enum(["upsert", "delete"]),
  baseVersion: z.number().int().nonnegative(),
  patch: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

export const aiSuggestionSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum(["task", "event", "someday", "discuss", "archive", "ignore"]),
  thoughtIds: z.array(z.string().min(1)).min(1),
  title: z.string().trim().min(1).max(240),
  rationale: z.string().trim().min(1).max(1200),
  nextAction: z.string().trim().max(1000).nullable().optional(),
  scheduledStartAt: z.string().datetime().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  durationMinutes: z.number().int().min(5).max(1440).nullable().optional(),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
});

export const aiToolResultSchema = z.object({
  suggestions: z.array(
    aiSuggestionSchema.omit({ id: true, status: true }).extend({
      clientKey: z.string().min(1).max(120),
    }),
  ),
});

export function normalizeAiToolResultInput(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.suggestions)) return value;
  return {
    ...record,
    suggestions: record.suggestions.map((suggestion) => {
      if (!suggestion || typeof suggestion !== "object") return suggestion;
      const item = suggestion as Record<string, unknown>;
      return {
        ...item,
        scheduledStartAt: normalizeAiDate(item.scheduledStartAt),
        dueAt: normalizeAiDate(item.dueAt),
        durationMinutes: normalizeAiDuration(item.durationMinutes),
      };
    }),
  };
}

function normalizeAiDate(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeAiDuration(value: unknown): unknown {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 5 || parsed > 1440) return null;
  return parsed;
}
