import { useCallback, type Dispatch, type SetStateAction } from "react";
import { newId, nowIso, type CalendarEvent, type PlannerSettings } from "@/lib/domain";
import { getPlannerDb } from "@/lib/local-db";
import type { NewEventInput } from "../contracts";
import { legacyReminder, operationFor } from "../internals";

export function useEventMutations({
  events,
  settings,
  setEvents,
  addOriginLinks,
  kickSync,
}: {
  events: CalendarEvent[];
  settings: PlannerSettings;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  addOriginLinks: (sourceThoughtIds: string[], target: CalendarEvent) => Promise<void>;
  kickSync: () => void;
}) {
  const addEvent = useCallback(
    async (input: NewEventInput) => {
      const time = nowIso();
      const event: CalendarEvent = {
        id: newId("event"),
        entityType: "event",
        eventKind: input.eventKind ?? "event",
        title: input.title.trim(),
        location: input.location?.trim() || null,
        notes: input.notes?.trim() ?? "",
        status: "open",
        completedAt: null,
        itemTypeId: input.itemTypeId ?? "temporary",
        colorOverride: input.colorOverride ?? null,
        startAt: input.startAt,
        endAt: input.endAt,
        recurrenceRule: input.recurrenceRule ?? null,
        excludedOccurrenceKeys: input.excludedOccurrenceKeys ?? [],
        recurrenceEndAt: input.recurrenceEndAt ?? null,
        reminderOffsetMinutes: input.reminderOffsetMinutes ?? null,
        reminderRules: input.reminderRules ?? legacyReminder(input.reminderOffsetMinutes),
        timezone:
          input.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          settings.timezone,
        originThoughtIds: input.originThoughtIds ?? [],
        createdAt: time,
        updatedAt: time,
        version: 1,
      };
      const db = getPlannerDb();
      setEvents((current) =>
        [event, ...current].sort((a, b) => a.startAt.localeCompare(b.startAt)),
      );
      try {
        await db.transaction("rw", [db.events, db.operations], async () => {
          await db.events.put(event);
          await db.operations.put(operationFor(event, 0));
        });
        await addOriginLinks(event.originThoughtIds, event);
        kickSync();
        return event;
      } catch (error) {
        setEvents((current) => current.filter((item) => item.id !== event.id));
        throw error;
      }
    },
    [addOriginLinks, kickSync, setEvents, settings.timezone],
  );

  const updateEvent = useCallback(
    async (id: string, patch: Partial<CalendarEvent>) => {
      const db = getPlannerDb();
      const current = events.find((event) => event.id === id) ?? await db.events.get(id);
      if (!current) return;
      const nextPatch = { ...patch, updatedAt: nowIso(), version: current.version + 1 };
      const next = { ...current, ...nextPatch };
      setEvents((items) =>
        items
          .map((item) => (item.id === id ? next : item))
          .sort((a, b) => a.startAt.localeCompare(b.startAt)),
      );
      try {
        await db.transaction("rw", [db.events, db.operations], async () => {
          await db.events.update(id, nextPatch);
          await db.operations.put(
            operationFor(next, current.version, "upsert", nextPatch),
          );
        });
      } catch (error) {
        setEvents((items) =>
          items
            .map((item) => (item.id === id ? current : item))
            .sort((a, b) => a.startAt.localeCompare(b.startAt)),
        );
        throw error;
      }
      kickSync();
    },
    [events, kickSync, setEvents],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const db = getPlannerDb();
      const current = events.find((event) => event.id === id) ?? await db.events.get(id);
      if (!current) return;
      const time = nowIso();
      const patch: Partial<CalendarEvent> = {
        title: "",
        notes: "",
        deletedAt: time,
        reminderRules: [],
        updatedAt: time,
        version: current.version + 1,
      };
      setEvents((items) => items.filter((item) => item.id !== id));
      try {
        await db.transaction("rw", [db.events, db.operations], async () => {
          await db.events.update(id, patch);
          await db.operations.put(
            operationFor({ ...current, ...patch }, current.version, "delete", patch),
          );
        });
      } catch (error) {
        setEvents((items) =>
          [...items, current].sort((a, b) => a.startAt.localeCompare(b.startAt)),
        );
        throw error;
      }
      kickSync();
    },
    [events, kickSync, setEvents],
  );
  return { addEvent, updateEvent, deleteEvent };
}
