import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import * as rruleModule from "npm:rrule@2.8.1";

const rruleRuntime = Reflect.get(rruleModule, "default") ?? rruleModule;
const { rrulestr } = rruleRuntime;
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const cronSecret = Deno.env.get("REMINDER_CRON_SECRET") || "";
const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "";
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (vapidPublic && vapidPrivate && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

function safeEqual(left: string, right: string): boolean {
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function localDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

Deno.serve(async (request) => {
  if (!safeEqual(request.headers.get("x-cron-secret") || "", cronSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate || !vapidSubject) {
    return Response.json({ message: "Reminder service is not configured." }, { status: 503 });
  }

  console.log("[reminders] checkpoint=materialize status=started");
  const { data: materialized, error: materializeError } = await supabase.rpc(
    "planner_materialize_reminders",
  );
  if (materializeError) throw materializeError;
  console.log(`[reminders] checkpoint=materialize status=complete created=${materialized || 0}`);

  const { data: recurringSources, error: recurringError } = await supabase.rpc(
    "planner_recurring_reminder_sources",
  );
  if (recurringError) throw recurringError;
  const generated = [];
  const currentTime = new Date();
  for (const source of recurringSources || []) {
    try {
      for (const rule of source.record.reminderRules || []) {
        const offset = Number(rule.offsetMinutes || 0);
        const windowStart = new Date(currentTime.getTime() + offset * 60_000 - 90_000);
        const windowEnd = new Date(currentTime.getTime() + offset * 60_000 + 90_000);
        const occurrences = rrulestr(source.record.recurrenceRule).between(
          windowStart,
          windowEnd,
          true,
        );
        for (const occurrence of occurrences) {
          if (
            source.record.recurrenceEndAt &&
            occurrence > new Date(source.record.recurrenceEndAt)
          ) {
            continue;
          }
          if (
            source.entityType === "task" &&
            (source.record.completedOccurrenceKeys || []).includes(
              localDateKey(occurrence, source.timezone),
            )
          ) {
            continue;
          }
          generated.push({
            ownerId: source.ownerId,
            sourceType: source.entityType,
            sourceId: source.entityId,
            fireAt: new Date(occurrence.getTime() - offset * 60_000).toISOString(),
            timezone: source.timezone,
            title: source.record.title || "重复事项提醒",
            body:
              source.entityType === "task"
                ? "重复任务即将到期"
                : source.record.eventKind === "course"
                  ? "课程即将开始"
                  : source.record.eventKind === "exam"
                    ? "考试即将开始"
                    : "重复日程即将开始",
          });
        }
      }
    } catch (error) {
      console.error(`[reminders] recurrence source=${source.entityId} status=invalid`, error);
    }
  }
  if (generated.length) {
    const { error: enqueueError } = await supabase.rpc("planner_enqueue_reminders", {
      p_reminders: generated,
    });
    if (enqueueError) throw enqueueError;
  }
  console.log(`[reminders] checkpoint=recurrence status=complete generated=${generated.length}`);

  const workerId = crypto.randomUUID();
  const { data: reminders, error: claimError } = await supabase.rpc(
    "planner_claim_reminders",
    { p_worker: workerId, p_batch_size: 100 },
  );
  if (claimError) throw claimError;

  console.log(`[reminders] checkpoint=dispatch status=started claimed=${reminders?.length || 0}`);
  let sent = 0;
  let retried = 0;
  let missed = 0;
  for (const [index, reminder] of (reminders || []).entries()) {
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("planner_push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("owner_id", reminder.owner_id)
      .eq("active", true);
    if (subscriptionError) throw subscriptionError;

    if (!subscriptions?.length) {
      await saveMissedNotification(reminder);
      missed += 1;
    }

    let temporaryFailure = false;
    for (const subscription of subscriptions || []) {
      const { data: existing } = await supabase
        .from("planner_reminder_deliveries")
        .select("status")
        .eq("reminder_id", reminder.id)
        .eq("subscription_id", subscription.id)
        .maybeSingle();
      if (existing?.status === "sent") continue;

      try {
        const response = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            reminderId: reminder.id,
            title: reminder.title,
            body: reminder.body,
            url: reminder.target_url,
          }),
          { TTL: 3600, urgency: "normal" },
        );
        await supabase.from("planner_reminder_deliveries").upsert({
          reminder_id: reminder.id,
          subscription_id: subscription.id,
          status: "sent",
          provider_status: response.statusCode,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number }).statusCode || 0);
        const permanent = statusCode === 404 || statusCode === 410;
        if (permanent) {
          await supabase
            .from("planner_push_subscriptions")
            .update({
              active: false,
              invalidated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
        } else {
          temporaryFailure = true;
        }
        await supabase.from("planner_reminder_deliveries").upsert({
          reminder_id: reminder.id,
          subscription_id: subscription.id,
          status: permanent ? "permanent_failure" : "temporary_failure",
          provider_status: statusCode || null,
          error: error instanceof Error ? error.message.slice(0, 1000) : "push failed",
          updated_at: new Date().toISOString(),
        });
      }
    }

    await supabase.rpc("planner_finish_reminder", {
      p_reminder_id: reminder.id,
      p_success: !temporaryFailure,
      p_error: temporaryFailure ? "One or more devices had a temporary push failure." : null,
    });
    if (temporaryFailure) retried += 1;
    else sent += 1;
    console.log(
      `[reminders] checkpoint=dispatch progress=${index + 1}/${reminders.length} sent=${sent} retried=${retried} missed=${missed}`,
    );
  }

  console.log("[reminders] checkpoint=dispatch status=complete");
  return Response.json({ claimed: reminders?.length || 0, sent, retried, missed });
});

async function saveMissedNotification(reminder: Record<string, unknown>) {
  const id = `notification_${reminder.id}`;
  const now = new Date().toISOString();
  const record = {
    id,
    entityType: "notification",
    title: reminder.title,
    body: reminder.body,
    targetUrl: reminder.target_url,
    readAt: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  const { data: existing } = await supabase
    .from("planner_records")
    .select("entity_id")
    .eq("owner_id", reminder.owner_id)
    .eq("entity_type", "notification")
    .eq("entity_id", id)
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase.from("planner_records").insert({
    owner_id: reminder.owner_id,
    entity_type: "notification",
    entity_id: id,
    record_data: record,
    version: 1,
    field_versions: {},
    updated_at: now,
  });
  if (error) throw error;
  const { error: changeError } = await supabase.from("planner_change_log").insert({
    owner_id: reminder.owner_id,
    entity_type: "notification",
    entity_id: id,
    operation: "upsert",
    record_data: record,
    version: 1,
  });
  if (changeError) throw changeError;
}
