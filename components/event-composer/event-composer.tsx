"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Modal drafts intentionally reset when opened. */

import "./event-composer.css";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  fromDateTimeLocal,
  localDateKey,
  parseRepeatPreset,
  toDateTimeLocal,
  type CalendarEvent,
} from "@/lib/domain";
import { usePlanner } from "../planner-provider";
import { InspectorShell } from "../composer-shell";
import {
  makeRules,
  ReminderPicker,
  type RepeatPreset,
} from "../composer-shared";
import { ComposerActions } from "../task-composer/actions";
import { TaskComposer } from "../task-composer/task-composer";
import {
  EventColorSection,
  EventNotesSection,
  EventOriginsSection,
  EventScheduleSection,
  EventTitleSection,
  EventTypeSection,
} from "./event-sections";

export function EventComposer({
  open,
  event,
  defaultDate,
  occurrenceAt,
  onClose,
}: {
  open: boolean;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  occurrenceAt?: string;
  onClose: () => void;
}) {
  if (event?.eventKind === "course") {
    return (
      <TaskComposer
        open={open}
        courseEvent={event}
        defaultDate={defaultDate}
        courseOccurrenceAt={occurrenceAt}
        defaultTime
        onClose={onClose}
      />
    );
  }
  return (
    <StandardEventComposer
      open={open}
      event={event}
      defaultDate={defaultDate}
      occurrenceAt={occurrenceAt}
      onClose={onClose}
    />
  );
}

function StandardEventComposer({
  open,
  event,
  defaultDate,
  occurrenceAt,
  onClose,
}: {
  open: boolean;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  occurrenceAt?: string;
  onClose: () => void;
}) {
  const { addEvent, updateEvent, deleteEvent, thoughts, settings } = usePlanner();
  const origins = event
    ? event.originThoughtIds
        .map((id) => thoughts.find((thought) => thought.id === id))
        .filter((thought): thought is NonNullable<typeof thought> => Boolean(thought))
    : [];
  const baseStart = useMemo(() => {
    const date = defaultDate ? new Date(defaultDate) : new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  }, [defaultDate]);
  const [title, setTitle] = useState("");
  const [itemTypeId, setItemTypeId] = useState("temporary");
  const [colorOverride, setColorOverride] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [repeat, setRepeat] = useState<RepeatPreset>("none");
  const [recurrenceEndAt, setRecurrenceEndAt] = useState("");
  const [reminders, setReminders] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setItemTypeId(event?.itemTypeId ?? "temporary");
    setColorOverride(event?.colorOverride ?? "");
    setStartAt(toDateTimeLocal(event?.startAt ?? baseStart.toISOString()));
    setEndAt(toDateTimeLocal(event?.endAt ?? new Date(baseStart.getTime() + 30 * 60_000).toISOString()));
    setNotes(event?.notes ?? "");
    setRepeat(event?.recurrenceRule ? "weekly" : "none");
    setRecurrenceEndAt(event?.recurrenceEndAt?.slice(0, 10) ?? localDateKey(baseStart));
    setReminders((event?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
  }, [baseStart, event, open]);

  async function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const startIso = fromDateTimeLocal(startAt);
    const endIso = fromDateTimeLocal(endAt);
    if (!title.trim() || !startIso || !endIso) return;
    setSaving(true);
    const patch = {
      title,
      eventKind: event?.eventKind === "exam" ? ("exam" as const) : ("event" as const),
      itemTypeId,
      colorOverride: colorOverride || null,
      location: null,
      notes,
      startAt: startIso,
      endAt: endIso,
      recurrenceRule: parseRepeatPreset(
        repeat === "custom" ? "weekly" : repeat,
        startIso,
        repeat === "none" ? null : recurrenceEndAt || null,
      ),
      excludedOccurrenceKeys: repeat === "none" ? [] : event?.excludedOccurrenceKeys ?? [],
      recurrenceEndAt: repeat === "none" ? null : recurrenceEndAt || null,
      reminderOffsetMinutes: reminders[0] ?? null,
      reminderRules: makeRules(reminders, "start"),
      timezone: settings.timezone,
    };
    try {
      if (event) await updateEvent(event.id, patch);
      else await addEvent(patch);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const selectedEventType =
    settings.itemTypes.find((type) => type.id === itemTypeId) ?? settings.itemTypes[0];
  const eventPreviewColor =
    colorOverride || selectedEventType?.color || "#AFC3D4";
  function selectType(nextId: string) {
    setItemTypeId(nextId);
    setColorOverride("");
  }
  return (
    <InspectorShell
      title={event ? "编辑日程" : "新建日程"}
      panelClassName="event-composer-inspector"
      onClose={onClose}
    >
      <form className="composer-form event-composer-form" onSubmit={submit}>
        <EventTitleSection
          title={title}
          previewColor={eventPreviewColor}
          typeName={selectedEventType?.name ?? "未选择类型"}
          onTitleChange={setTitle}
        />
        <EventTypeSection itemTypes={settings.itemTypes.filter((type) => type.id !== "course")} selectedId={itemTypeId} onSelect={selectType} />
        <EventColorSection colorOverride={colorOverride} onChange={setColorOverride} />
        <EventScheduleSection
          startAt={startAt}
          endAt={endAt}
          repeat={repeat}
          recurrenceEndAt={recurrenceEndAt}
          onStartChange={setStartAt}
          onEndChange={setEndAt}
          onRepeatChange={setRepeat}
          onRecurrenceEndChange={setRecurrenceEndAt}
        />
        <ReminderPicker values={reminders} onChange={setReminders} />
        <EventNotesSection notes={notes} onChange={setNotes} />
        <EventOriginsSection origins={origins} />
        <ComposerActions
          saving={saving}
          enabled={Boolean(title.trim())}
          onClose={onClose}
          label="保存日程"
          deleteLabel={event?.recurrenceRule && occurrenceAt ? "删除本次日程" : undefined}
          onDelete={
            event
              ? async () => {
                  if (event.recurrenceRule && occurrenceAt) {
                    const occurrenceKey = localDateKey(new Date(occurrenceAt));
                    await updateEvent(event.id, {
                      excludedOccurrenceKeys: Array.from(new Set([...(event.excludedOccurrenceKeys ?? []), occurrenceKey])),
                    });
                  } else {
                    await deleteEvent(event.id);
                  }
                  onClose();
                }
              : undefined
          }
        />
      </form>
    </InspectorShell>
  );
}
