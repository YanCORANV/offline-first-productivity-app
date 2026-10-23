create or replace function public.planner_materialize_reminders(
  p_now timestamptz default now()
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
  v_count integer;
begin
  insert into public.planner_reminders (
    owner_id,
    kind,
    source_type,
    source_id,
    fire_at,
    timezone,
    title,
    body,
    target_url
  )
  select
    source.owner_id,
    case
      when source.entity_type = 'scheduleBlock' then 'schedule_block'
      when source.entity_type = 'event' and source.record_data ->> 'eventKind' = 'course' then 'course_start'
      when source.entity_type = 'event' and source.record_data ->> 'eventKind' = 'exam' then 'exam_start'
      when source.entity_type = 'event' then 'event_start'
      when source.record_data ->> 'taskKind' = 'assignment'
        and rule ->> 'anchor' = 'desired' then 'assignment_desired'
      when source.record_data ->> 'taskKind' = 'assignment'
        and rule ->> 'anchor' = 'deadline' then 'assignment_deadline'
      else 'task_due'
    end,
    source.entity_type,
    source.entity_id,
    anchor.fire_at - make_interval(mins => coalesce((rule ->> 'offsetMinutes')::integer, 0)),
    coalesce(source.record_data ->> 'timezone', settings.record_data ->> 'timezone', 'Asia/Shanghai'),
    coalesce(source.record_data ->> 'title', '计划提醒'),
    case
      when source.entity_type = 'scheduleBlock' then '计划的执行时间即将开始'
      when source.entity_type = 'event' and source.record_data ->> 'eventKind' = 'course' then '课程即将开始'
      when source.entity_type = 'event' and source.record_data ->> 'eventKind' = 'exam' then '考试即将开始'
      when source.entity_type = 'event' then '日程即将开始'
      when source.record_data ->> 'assignmentStatus' = 'content_done' then '作业内容已完成，记得提交'
      when source.record_data ->> 'taskKind' = 'assignment' then '作业期限即将到达'
      else '任务即将到期'
    end,
    case when source.entity_type = 'scheduleBlock' then '/calendar' else '/today' end
  from public.planner_records source
  left join public.planner_records settings
    on settings.owner_id = source.owner_id
    and settings.entity_type = 'settings'
    and settings.entity_id = 'main'
  cross join lateral jsonb_array_elements(
    coalesce(source.record_data -> 'reminderRules', '[]'::jsonb)
  ) rule
  cross join lateral (
    select case
      when source.entity_type = 'event' and rule ->> 'anchor' = 'end'
        then nullif(source.record_data ->> 'endAt', '')::timestamptz
      when source.entity_type = 'event'
        then nullif(source.record_data ->> 'startAt', '')::timestamptz
      when source.entity_type = 'scheduleBlock' and rule ->> 'anchor' = 'end'
        then coalesce(
          nullif(source.record_data ->> 'endAt', '')::timestamptz,
          (
            (source.record_data ->> 'date')::date + time '09:00'
          ) at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai')
        )
      when source.entity_type = 'scheduleBlock'
        then coalesce(
          nullif(source.record_data ->> 'startAt', '')::timestamptz,
          (
            (source.record_data ->> 'date')::date + time '09:00'
          ) at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai')
        )
      when rule ->> 'anchor' = 'desired'
        then nullif(source.record_data ->> 'desiredCompletionAt', '')::timestamptz
      when rule ->> 'anchor' = 'deadline'
        then nullif(source.record_data ->> 'actualDeadlineAt', '')::timestamptz
      when rule ->> 'anchor' = 'start'
        then nullif(source.record_data ->> 'scheduledStartAt', '')::timestamptz
      else coalesce(
        nullif(source.record_data ->> 'dueAt', '')::timestamptz,
        nullif(source.record_data ->> 'actualDeadlineAt', '')::timestamptz
      )
    end as fire_at
  ) anchor
  where source.entity_type in ('task', 'event', 'scheduleBlock')
    and source.deleted_at is null
    and anchor.fire_at is not null
    and source.record_data ->> 'recurrenceRule' is null
    and (
      source.entity_type <> 'task'
      or source.record_data ->> 'status' = 'open'
    )
    and (
      source.entity_type <> 'scheduleBlock'
      or source.record_data ->> 'status' = 'planned'
    )
  on conflict do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_inserted + v_count;

  insert into public.planner_reminders (
    owner_id,
    kind,
    source_type,
    source_id,
    fire_at,
    timezone,
    title,
    body,
    target_url
  )
  select
    settings.owner_id,
    review.kind,
    'settings',
    review.kind || ':' || review.local_date::text,
    (review.local_date + review.local_time) at time zone review.timezone,
    review.timezone,
    review.title,
    review.body,
    '/reviews'
  from public.planner_records settings
  cross join lateral (
    select
      coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai') as timezone,
      (p_now at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'))::date as local_date
  ) local_context
  cross join lateral (
    select
      'daily_review'::text as kind,
      local_context.timezone,
      local_context.local_date,
      coalesce(nullif(settings.record_data ->> 'reviewTime', '')::time, time '20:30') as local_time,
      'Daily Review'::text as title,
      '处理 Inbox，并回顾今天的执行情况'::text as body
    where coalesce((settings.record_data ->> 'dailyReviewEnabled')::boolean, true)
    union all
    select
      'weekly_review',
      local_context.timezone,
      local_context.local_date,
      coalesce(nullif(settings.record_data ->> 'weeklyReviewTime', '')::time, time '20:30'),
      'Weekly Review',
      '回顾本周项目分支，并确定下周推进方向'
    where coalesce((settings.record_data ->> 'weeklyReviewEnabled')::boolean, true)
      and extract(dow from local_context.local_date) = 0
    union all
    select
      'monthly_review',
      local_context.timezone,
      local_context.local_date,
      coalesce(nullif(settings.record_data ->> 'monthlyReviewTime', '')::time, time '20:30'),
      'Monthly Review',
      '回顾各 Goal 下的项目进展和下月关注方向'
    where coalesce((settings.record_data ->> 'monthlyReviewEnabled')::boolean, true)
      and local_context.local_date =
        (date_trunc('month', local_context.local_date) + interval '1 month - 1 day')::date
  ) review
  where settings.entity_type = 'settings'
    and settings.entity_id = 'main'
    and settings.deleted_at is null
  on conflict do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_inserted + v_count;

  insert into public.planner_reminders (
    owner_id,
    kind,
    source_type,
    source_id,
    fire_at,
    timezone,
    title,
    body,
    target_url
  )
  select
    thought.owner_id,
    'inbox_stale',
    'thought',
    thought.entity_id,
    (thought.record_data ->> 'createdAt')::timestamptz
      + make_interval(hours => coalesce((settings.record_data ->> 'inboxAgeHours')::integer, 48)),
    coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'),
    '一条想法还在 Inbox',
    left(thought.record_data ->> 'content', 120),
    '/inbox'
  from public.planner_records thought
  join public.planner_records settings
    on settings.owner_id = thought.owner_id
    and settings.entity_type = 'settings'
    and settings.entity_id = 'main'
  where thought.entity_type = 'thought'
    and thought.deleted_at is null
    and thought.record_data ->> 'status' = 'inbox'
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_inserted + v_count;
end;
$$;

create or replace function public.planner_recurring_reminder_sources()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'ownerId', source.owner_id,
    'entityType', source.entity_type,
    'entityId', source.entity_id,
    'record', source.record_data,
    'timezone', coalesce(
      source.record_data ->> 'timezone',
      settings.record_data ->> 'timezone',
      'Asia/Shanghai'
    )
  )), '[]'::jsonb)
  from public.planner_records source
  left join public.planner_records settings
    on settings.owner_id = source.owner_id
    and settings.entity_type = 'settings'
    and settings.entity_id = 'main'
  where source.entity_type in ('task', 'event')
    and source.deleted_at is null
    and source.record_data ->> 'recurrenceRule' is not null
    and jsonb_array_length(coalesce(source.record_data -> 'reminderRules', '[]'::jsonb)) > 0
    and (
      source.entity_type = 'event'
      or source.record_data ->> 'status' = 'open'
    );
$$;

revoke all on function public.planner_materialize_reminders(timestamptz) from public;
revoke all on function public.planner_recurring_reminder_sources() from public;
grant execute on function public.planner_materialize_reminders(timestamptz) to service_role;
grant execute on function public.planner_recurring_reminder_sources() to service_role;

create or replace function public.planner_cancel_future_reminders_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.entity_type = 'settings' then
    update public.planner_reminders
    set status = 'cancelled', updated_at = now()
    where owner_id = new.owner_id
      and status in ('pending', 'retry')
      and fire_at > now()
      and kind in (
        'daily_review',
        'weekly_review',
        'monthly_review',
        'inbox_stale',
        'recurrence'
      );
  elsif new.entity_type in ('task', 'event', 'scheduleBlock') then
    update public.planner_reminders
    set status = 'cancelled', updated_at = now()
    where owner_id = new.owner_id
      and source_type = new.entity_type
      and source_id = new.entity_id
      and status in ('pending', 'retry')
      and fire_at > now();
  end if;
  return new;
end;
$$;

drop trigger if exists planner_cancel_future_reminders_v2_trigger
  on public.planner_records;
create trigger planner_cancel_future_reminders_v2_trigger
after update on public.planner_records
for each row execute function public.planner_cancel_future_reminders_v2();

revoke all on function public.planner_cancel_future_reminders_v2() from public;
