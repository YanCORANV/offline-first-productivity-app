create extension if not exists pgcrypto;

create table if not exists public.planner_records (
  owner_id text not null,
  entity_type text not null check (entity_type in ('thought', 'task', 'event', 'settings', 'aiRun')),
  entity_id text not null,
  record_data jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version >= 0),
  field_versions jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, entity_type, entity_id)
);

create index if not exists planner_records_owner_updated_idx
  on public.planner_records (owner_id, updated_at desc);
create index if not exists planner_records_active_type_idx
  on public.planner_records (owner_id, entity_type)
  where deleted_at is null;

create table if not exists public.planner_sync_operations (
  owner_id text not null,
  operation_id text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, operation_id)
);

create table if not exists public.planner_change_log (
  cursor bigint generated always as identity primary key,
  owner_id text not null,
  entity_type text not null,
  entity_id text not null,
  operation text not null check (operation in ('upsert', 'delete')),
  record_data jsonb not null,
  version integer not null,
  created_at timestamptz not null default now()
);

create index if not exists planner_change_log_owner_cursor_idx
  on public.planner_change_log (owner_id, cursor);

create table if not exists public.planner_conflicts (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  operation_id text not null,
  entity_type text not null,
  entity_id text not null,
  local_patch jsonb not null,
  server_record jsonb not null,
  conflicting_fields text[] not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (owner_id, operation_id)
);

create table if not exists public.planner_ai_runs (
  owner_id text not null,
  id text not null,
  provider text not null,
  model text not null,
  thought_ids text[] not null,
  status text not null check (status in ('running', 'ready', 'failed', 'confirmed')),
  run_data jsonb not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.planner_ai_suggestions (
  owner_id text not null,
  run_id text not null,
  id text not null,
  suggestion_data jsonb not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_entity_type text,
  created_entity_id text,
  created_at timestamptz not null default now(),
  primary key (owner_id, run_id, id),
  foreign key (owner_id, run_id)
    references public.planner_ai_runs (owner_id, id) on delete cascade
);

create table if not exists public.planner_origin_links (
  owner_id text not null,
  thought_id text not null,
  target_type text not null check (target_type in ('task', 'event')),
  target_id text not null,
  ai_run_id text,
  created_at timestamptz not null default now(),
  primary key (owner_id, thought_id, target_type, target_id)
);

create index if not exists planner_origin_links_target_idx
  on public.planner_origin_links (owner_id, target_type, target_id);

create table if not exists public.planner_reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  kind text not null check (
    kind in ('event_start', 'task_due', 'recurrence', 'daily_review', 'inbox_stale')
  ),
  source_type text not null,
  source_id text not null,
  fire_at timestamptz not null,
  timezone text not null,
  title text not null,
  body text not null,
  target_url text not null default '/today',
  status text not null default 'pending' check (
    status in ('pending', 'leased', 'retry', 'sent', 'cancelled')
  ),
  lease_until timestamptz,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, kind, source_type, source_id, fire_at)
);

create index if not exists planner_reminders_due_idx
  on public.planner_reminders (fire_at, next_attempt_at)
  where status in ('pending', 'leased', 'retry');

create table if not exists public.planner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  timezone text not null,
  user_agent text not null default '',
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, endpoint)
);

create table if not exists public.planner_reminder_deliveries (
  reminder_id uuid not null references public.planner_reminders (id) on delete cascade,
  subscription_id uuid not null references public.planner_push_subscriptions (id) on delete cascade,
  status text not null check (status in ('sent', 'temporary_failure', 'permanent_failure')),
  provider_status integer,
  error text,
  updated_at timestamptz not null default now(),
  primary key (reminder_id, subscription_id)
);

alter table public.planner_records enable row level security;
alter table public.planner_sync_operations enable row level security;
alter table public.planner_change_log enable row level security;
alter table public.planner_conflicts enable row level security;
alter table public.planner_ai_runs enable row level security;
alter table public.planner_ai_suggestions enable row level security;
alter table public.planner_origin_links enable row level security;
alter table public.planner_reminders enable row level security;
alter table public.planner_push_subscriptions enable row level security;
alter table public.planner_reminder_deliveries enable row level security;

create or replace function public.planner_pull_changes(
  p_owner text,
  p_cursor bigint default 0
) returns jsonb
language sql
security definer
set search_path = public
as $$
  with selected as (
    select
      cursor,
      entity_type as "entityType",
      entity_id as "entityId",
      operation,
      record_data as record,
      version
    from public.planner_change_log
    where owner_id = p_owner and cursor > p_cursor
    order by cursor
    limit 2000
  )
  select jsonb_build_object(
    'changes',
    coalesce(jsonb_agg(to_jsonb(selected) order by cursor), '[]'::jsonb),
    'cursor',
    coalesce(max(cursor), p_cursor)
  )
  from selected;
$$;

create or replace function public.planner_push_operations(
  p_owner text,
  p_operations jsonb,
  p_cursor bigint default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation jsonb;
  v_existing_result jsonb;
  v_record jsonb;
  v_patch jsonb;
  v_field_versions jsonb;
  v_new_field_versions jsonb;
  v_conflicting_fields text[];
  v_base_version integer;
  v_new_version integer;
  v_action text;
  v_type text;
  v_entity_id text;
  v_operation_id text;
  v_conflict_id uuid;
  v_deleted_at timestamptz;
  v_acknowledged jsonb := '[]'::jsonb;
  v_conflicts jsonb := '[]'::jsonb;
  v_result jsonb;
  v_pull jsonb;
begin
  if jsonb_typeof(p_operations) <> 'array' then
    raise exception 'operations must be an array';
  end if;

  insert into public.planner_records (
    owner_id, entity_type, entity_id, record_data, version, field_versions, created_at, updated_at
  ) values (
    p_owner,
    'settings',
    'main',
    jsonb_build_object(
      'id', 'main',
      'version', 0,
      'timezone', 'Asia/Shanghai',
      'reviewTime', '20:30',
      'inboxAgeHours', 48,
      'cloudCursor', 0,
      'notificationState', 'unknown'
    ),
    0,
    '{}'::jsonb,
    now(),
    now()
  )
  on conflict (owner_id, entity_type, entity_id) do nothing;

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    v_operation_id := v_operation ->> 'id';
    v_type := v_operation ->> 'entityType';
    v_entity_id := v_operation ->> 'entityId';
    v_action := v_operation ->> 'action';
    v_base_version := coalesce((v_operation ->> 'baseVersion')::integer, 0);
    v_patch := coalesce(v_operation -> 'patch', '{}'::jsonb);

    select result into v_existing_result
    from public.planner_sync_operations
    where owner_id = p_owner and operation_id = v_operation_id;

    if found then
      if v_existing_result ->> 'status' = 'conflict' then
        v_conflicts := v_conflicts || jsonb_build_array(v_existing_result -> 'conflict');
      else
        v_acknowledged := v_acknowledged || jsonb_build_array(v_operation_id);
      end if;
      continue;
    end if;

    select record_data, version, field_versions
      into v_record, v_new_version, v_field_versions
    from public.planner_records
    where owner_id = p_owner
      and entity_type = v_type
      and entity_id = v_entity_id
    for update;

    if not found then
      v_record := '{}'::jsonb;
      v_new_version := 0;
      v_field_versions := '{}'::jsonb;
    end if;

    select array_agg(field_name order by field_name)
      into v_conflicting_fields
    from jsonb_object_keys(v_patch) as field_name
    where field_name not in ('version', 'updatedAt', 'createdAt')
      and coalesce((v_field_versions ->> field_name)::integer, 0) > v_base_version;

    if coalesce(array_length(v_conflicting_fields, 1), 0) > 0 then
      insert into public.planner_conflicts (
        owner_id,
        operation_id,
        entity_type,
        entity_id,
        local_patch,
        server_record,
        conflicting_fields
      ) values (
        p_owner,
        v_operation_id,
        v_type,
        v_entity_id,
        v_patch,
        v_record,
        v_conflicting_fields
      )
      returning id into v_conflict_id;

      v_result := jsonb_build_object(
        'status', 'conflict',
        'conflict', jsonb_build_object(
          'id', v_conflict_id::text,
          'operationId', v_operation_id,
          'entityType', v_type,
          'entityId', v_entity_id,
          'localPatch', v_patch,
          'serverRecord', v_record,
          'conflictingFields', to_jsonb(v_conflicting_fields),
          'createdAt', now()
        )
      );
      insert into public.planner_sync_operations (owner_id, operation_id, result)
      values (p_owner, v_operation_id, v_result);
      v_conflicts := v_conflicts || jsonb_build_array(v_result -> 'conflict');
      continue;
    end if;

    v_new_version := v_new_version + 1;
    select coalesce(jsonb_object_agg(field_name, v_new_version), '{}'::jsonb)
      into v_new_field_versions
    from jsonb_object_keys(v_patch) as field_name;

    if v_action = 'delete' then
      v_deleted_at := now();
      v_record := jsonb_build_object(
        'id', v_entity_id,
        'entityType', v_type,
        'version', v_new_version,
        'deletedAt', v_deleted_at,
        'updatedAt', v_deleted_at
      );
    else
      v_deleted_at := nullif(v_patch ->> 'deletedAt', '')::timestamptz;
      v_record := v_record || v_patch || jsonb_build_object(
        'id', v_entity_id,
        'entityType', v_type,
        'version', v_new_version,
        'updatedAt', now()
      );
    end if;

    insert into public.planner_records (
      owner_id,
      entity_type,
      entity_id,
      record_data,
      version,
      field_versions,
      deleted_at,
      created_at,
      updated_at
    ) values (
      p_owner,
      v_type,
      v_entity_id,
      v_record,
      v_new_version,
      v_field_versions || v_new_field_versions,
      v_deleted_at,
      coalesce(nullif(v_record ->> 'createdAt', '')::timestamptz, now()),
      now()
    )
    on conflict (owner_id, entity_type, entity_id) do update set
      record_data = excluded.record_data,
      version = excluded.version,
      field_versions = excluded.field_versions,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;

    if v_type = 'settings' then
      update public.planner_reminders
      set status = 'cancelled', updated_at = now()
      where owner_id = p_owner
        and status in ('pending', 'retry')
        and fire_at > now()
        and kind in ('daily_review', 'inbox_stale', 'recurrence');
    elsif v_type in ('task', 'event') then
      update public.planner_reminders
      set status = 'cancelled', updated_at = now()
      where owner_id = p_owner
        and source_type = v_type
        and source_id = v_entity_id
        and status in ('pending', 'retry')
        and fire_at > now();
    end if;

    insert into public.planner_change_log (
      owner_id, entity_type, entity_id, operation, record_data, version
    ) values (
      p_owner,
      v_type,
      v_entity_id,
      case when v_deleted_at is null then 'upsert' else 'delete' end,
      v_record,
      v_new_version
    );

    if v_type in ('task', 'event') and v_deleted_at is null then
      insert into public.planner_origin_links (
        owner_id, thought_id, target_type, target_id
      )
      select
        p_owner,
        thought_id,
        v_type,
        v_entity_id
      from jsonb_array_elements_text(
        coalesce(v_record -> 'originThoughtIds', '[]'::jsonb)
      ) as thought_id
      on conflict do nothing;
    end if;

    insert into public.planner_sync_operations (owner_id, operation_id, result)
    values (p_owner, v_operation_id, jsonb_build_object('status', 'acknowledged'));
    v_acknowledged := v_acknowledged || jsonb_build_array(v_operation_id);
  end loop;

  v_pull := public.planner_pull_changes(p_owner, p_cursor);
  return jsonb_build_object(
    'acknowledged', v_acknowledged,
    'conflicts', v_conflicts,
    'changes', v_pull -> 'changes',
    'cursor', v_pull -> 'cursor'
  );
end;
$$;

create or replace function public.planner_save_ai_run(
  p_owner text,
  p_run jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion jsonb;
  v_run_id text := p_run ->> 'id';
begin
  if v_run_id is null or jsonb_array_length(coalesce(p_run -> 'suggestions', '[]'::jsonb)) > 100 then
    raise exception 'invalid ai run';
  end if;

  insert into public.planner_ai_runs (
    owner_id, id, provider, model, thought_ids, status, run_data, created_at, updated_at
  ) values (
    p_owner,
    v_run_id,
    p_run ->> 'provider',
    p_run ->> 'model',
    array(select jsonb_array_elements_text(p_run -> 'thoughtIds')),
    'ready',
    p_run,
    coalesce((p_run ->> 'createdAt')::timestamptz, now()),
    now()
  )
  on conflict (owner_id, id) do update set
    run_data = excluded.run_data,
    updated_at = now();

  for v_suggestion in select value from jsonb_array_elements(p_run -> 'suggestions')
  loop
    insert into public.planner_ai_suggestions (
      owner_id, run_id, id, suggestion_data, status
    ) values (
      p_owner, v_run_id, v_suggestion ->> 'id', v_suggestion, 'pending'
    )
    on conflict (owner_id, run_id, id) do nothing;
  end loop;

  insert into public.planner_records (
    owner_id, entity_type, entity_id, record_data, version, field_versions, created_at, updated_at
  ) values (
    p_owner, 'aiRun', v_run_id, p_run, 1, '{}'::jsonb, now(), now()
  )
  on conflict (owner_id, entity_type, entity_id) do update set
    record_data = excluded.record_data,
    updated_at = now();

  insert into public.planner_change_log (
    owner_id, entity_type, entity_id, operation, record_data, version
  ) values (p_owner, 'aiRun', v_run_id, 'upsert', p_run, 1);

  return p_run;
end;
$$;

create or replace function public.planner_confirm_ai_run(
  p_owner text,
  p_run_id text,
  p_suggestions jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.planner_ai_runs%rowtype;
  v_suggestion jsonb;
  v_type text;
  v_target_id text;
  v_record jsonb;
  v_thought_id text;
  v_now timestamptz := now();
begin
  select * into v_run
  from public.planner_ai_runs
  where owner_id = p_owner and id = p_run_id
  for update;

  if not found then raise exception 'ai run not found'; end if;
  if v_run.status = 'confirmed' then return v_run.run_data; end if;

  for v_suggestion in select value from jsonb_array_elements(p_suggestions)
  loop
    update public.planner_ai_suggestions
    set suggestion_data = v_suggestion,
        status = v_suggestion ->> 'status'
    where owner_id = p_owner
      and run_id = p_run_id
      and id = v_suggestion ->> 'id';

    if v_suggestion ->> 'status' <> 'accepted' then continue; end if;
    v_type := v_suggestion ->> 'type';

    if v_type in ('task', 'event') then
      v_target_id := v_type || '_' || gen_random_uuid()::text;
      if v_type = 'event' and nullif(v_suggestion ->> 'scheduledStartAt', '') is null then
        raise exception 'accepted event requires scheduledStartAt';
      end if;

      if v_type = 'task' then
        v_record := jsonb_build_object(
          'id', v_target_id,
          'entityType', 'task',
          'title', v_suggestion ->> 'title',
          'notes', coalesce(v_suggestion ->> 'rationale', ''),
          'status', 'open',
          'dueAt', v_suggestion -> 'dueAt',
          'scheduledStartAt', v_suggestion -> 'scheduledStartAt',
          'durationMinutes', v_suggestion -> 'durationMinutes',
          'recurrenceRule', null,
          'reminderOffsetMinutes', null,
          'completedAt', null,
          'completedOccurrenceKeys', '[]'::jsonb,
          'originThoughtIds', coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb),
          'createdAt', v_now,
          'updatedAt', v_now,
          'version', 1
        );
      else
        v_record := jsonb_build_object(
          'id', v_target_id,
          'entityType', 'event',
          'title', v_suggestion ->> 'title',
          'notes', coalesce(v_suggestion ->> 'rationale', ''),
          'startAt', v_suggestion -> 'scheduledStartAt',
          'endAt', to_jsonb(
            (v_suggestion ->> 'scheduledStartAt')::timestamptz +
            make_interval(mins => coalesce((v_suggestion ->> 'durationMinutes')::integer, 30))
          ),
          'recurrenceRule', null,
          'reminderOffsetMinutes', null,
          'originThoughtIds', coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb),
          'createdAt', v_now,
          'updatedAt', v_now,
          'version', 1
        );
      end if;

      insert into public.planner_records (
        owner_id, entity_type, entity_id, record_data, version, field_versions, created_at, updated_at
      ) values (
        p_owner, v_type, v_target_id, v_record, 1, '{}'::jsonb, v_now, v_now
      );
      insert into public.planner_change_log (
        owner_id, entity_type, entity_id, operation, record_data, version
      ) values (p_owner, v_type, v_target_id, 'upsert', v_record, 1);

      for v_thought_id in
        select jsonb_array_elements_text(coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb))
      loop
        insert into public.planner_origin_links (
          owner_id, thought_id, target_type, target_id, ai_run_id
        ) values (p_owner, v_thought_id, v_type, v_target_id, p_run_id)
        on conflict do nothing;
      end loop;

      update public.planner_ai_suggestions
      set created_entity_type = v_type, created_entity_id = v_target_id
      where owner_id = p_owner and run_id = p_run_id and id = v_suggestion ->> 'id';
    end if;

    for v_thought_id in
      select jsonb_array_elements_text(coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb))
    loop
      update public.planner_records
      set record_data = record_data || jsonb_build_object(
            'status', case when v_type = 'someday' then 'someday' else 'archived' end,
            'processedAt', v_now,
            'resultLabel',
              case
                when v_type = 'task' then '已转为任务'
                when v_type = 'event' then '已加入日程'
                when v_type = 'someday' then '以后再考虑'
                when v_type = 'discuss' then '需要进一步讨论'
                else '已归档'
              end,
            'updatedAt', v_now,
            'version', version + 1
          ),
          version = version + 1,
          updated_at = v_now
      where owner_id = p_owner and entity_type = 'thought' and entity_id = v_thought_id;

      insert into public.planner_change_log (
        owner_id, entity_type, entity_id, operation, record_data, version
      )
      select p_owner, 'thought', entity_id, 'upsert', record_data, version
      from public.planner_records
      where owner_id = p_owner and entity_type = 'thought' and entity_id = v_thought_id;
    end loop;
  end loop;

  update public.planner_ai_runs
  set status = 'confirmed',
      confirmed_at = v_now,
      updated_at = v_now,
      run_data = run_data || jsonb_build_object(
        'status', 'confirmed',
        'suggestions', p_suggestions,
        'updatedAt', v_now,
        'version', coalesce((run_data ->> 'version')::integer, 1) + 1
      )
  where owner_id = p_owner and id = p_run_id
  returning run_data into v_record;

  update public.planner_records
  set record_data = v_record, version = version + 1, updated_at = v_now
  where owner_id = p_owner and entity_type = 'aiRun' and entity_id = p_run_id;

  insert into public.planner_change_log (
    owner_id, entity_type, entity_id, operation, record_data, version
  )
  select p_owner, 'aiRun', entity_id, 'upsert', record_data, version
  from public.planner_records
  where owner_id = p_owner and entity_type = 'aiRun' and entity_id = p_run_id;

  return v_record;
end;
$$;

create or replace function public.planner_register_push(
  p_owner text,
  p_subscription jsonb,
  p_timezone text,
  p_user_agent text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.planner_push_subscriptions (
    owner_id, endpoint, p256dh, auth, timezone, user_agent, active
  ) values (
    p_owner,
    p_subscription ->> 'endpoint',
    p_subscription #>> '{keys,p256dh}',
    p_subscription #>> '{keys,auth}',
    p_timezone,
    p_user_agent,
    true
  )
  on conflict (owner_id, endpoint) do update set
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    timezone = excluded.timezone,
    user_agent = excluded.user_agent,
    active = true,
    invalidated_at = null,
    last_seen_at = now(),
    updated_at = now()
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'active', true);
end;
$$;

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
    owner_id, kind, source_type, source_id, fire_at, timezone, title, body, target_url
  )
  select
    owner_id,
    case when entity_type = 'task' then 'task_due' else 'event_start' end,
    entity_type,
    entity_id,
    (
      case when entity_type = 'task'
        then (record_data ->> 'dueAt')::timestamptz
        else (record_data ->> 'startAt')::timestamptz
      end
      - make_interval(mins => (record_data ->> 'reminderOffsetMinutes')::integer)
    ),
    coalesce(record_data ->> 'timezone', 'Asia/Shanghai'),
    coalesce(record_data ->> 'title', '计划提醒'),
    case when entity_type = 'task' then '任务即将到期' else '日程即将开始' end,
    '/today'
  from public.planner_records
  where entity_type in ('task', 'event')
    and deleted_at is null
    and record_data ->> 'reminderOffsetMinutes' is not null
    and record_data ->> (case when entity_type = 'task' then 'dueAt' else 'startAt' end) is not null
    and record_data ->> 'recurrenceRule' is null
    and (entity_type = 'event' or record_data ->> 'status' = 'open')
  on conflict do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_inserted + v_count;

  insert into public.planner_reminders (
    owner_id, kind, source_type, source_id, fire_at, timezone, title, body, target_url
  )
  select
    settings.owner_id,
    'daily_review',
    'settings',
    'daily-review-' || ((p_now at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'))::date)::text,
    (
      (p_now at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'))::date
      + coalesce(nullif(settings.record_data ->> 'reviewTime', '')::time, time '20:30')
    ) at time zone coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'),
    coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai'),
    '处理今天的想法',
    'Inbox 里还有今天记录的想法，花几分钟整理一下。',
    '/inbox'
  from public.planner_records settings
  where settings.entity_type = 'settings'
    and settings.deleted_at is null
    and exists (
      select 1
      from public.planner_records thought
      where thought.owner_id = settings.owner_id
        and thought.entity_type = 'thought'
        and thought.deleted_at is null
        and thought.record_data ->> 'status' = 'inbox'
    )
  on conflict do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_inserted + v_count;

  insert into public.planner_reminders (
    owner_id, kind, source_type, source_id, fire_at, timezone, title, body, target_url
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

create or replace function public.planner_claim_reminders(
  p_worker text,
  p_batch_size integer default 100
) returns setof public.planner_reminders
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
    from public.planner_reminders
    where fire_at <= now()
      and (
        status = 'pending'
        or (status = 'retry' and coalesce(next_attempt_at, now()) <= now())
        or (status = 'leased' and lease_until < now())
      )
    order by fire_at
    for update skip locked
    limit greatest(1, least(p_batch_size, 500))
  )
  update public.planner_reminders reminders
  set status = 'leased',
      lease_until = now() + interval '2 minutes',
      attempt_count = attempt_count + 1,
      updated_at = now(),
      last_error = null
  from due
  where reminders.id = due.id
  returning reminders.*;
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
    'timezone', coalesce(settings.record_data ->> 'timezone', 'Asia/Shanghai')
  )), '[]'::jsonb)
  from public.planner_records source
  left join public.planner_records settings
    on settings.owner_id = source.owner_id
    and settings.entity_type = 'settings'
    and settings.entity_id = 'main'
  where source.entity_type in ('task', 'event')
    and source.deleted_at is null
    and source.record_data ->> 'recurrenceRule' is not null
    and source.record_data ->> 'reminderOffsetMinutes' is not null
    and (
      source.entity_type = 'event'
      or source.record_data ->> 'status' = 'open'
    );
$$;

create or replace function public.planner_enqueue_reminders(
  p_reminders jsonb
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_inserted integer := 0;
begin
  if jsonb_typeof(p_reminders) <> 'array' or jsonb_array_length(p_reminders) > 1000 then
    raise exception 'invalid reminder batch';
  end if;
  for v_item in select value from jsonb_array_elements(p_reminders)
  loop
    insert into public.planner_reminders (
      owner_id, kind, source_type, source_id, fire_at, timezone, title, body, target_url
    ) values (
      v_item ->> 'ownerId',
      'recurrence',
      v_item ->> 'sourceType',
      v_item ->> 'sourceId',
      (v_item ->> 'fireAt')::timestamptz,
      v_item ->> 'timezone',
      v_item ->> 'title',
      v_item ->> 'body',
      '/today'
    )
    on conflict do nothing;
    if found then v_inserted := v_inserted + 1; end if;
  end loop;
  return v_inserted;
end;
$$;

create or replace function public.planner_finish_reminder(
  p_reminder_id uuid,
  p_success boolean,
  p_error text default null
) returns void
language sql
security definer
set search_path = public
as $$
  update public.planner_reminders
  set status = case when p_success then 'sent' else 'retry' end,
      sent_at = case when p_success then now() else sent_at end,
      next_attempt_at = case
        when p_success then null
        else now() + make_interval(secs => least(3600, (2 ^ least(attempt_count, 10))::integer * 15))
      end,
      last_error = left(p_error, 1000),
      lease_until = null,
      updated_at = now()
  where id = p_reminder_id;
$$;

revoke all on function public.planner_pull_changes(text, bigint) from public;
revoke all on function public.planner_push_operations(text, jsonb, bigint) from public;
revoke all on function public.planner_save_ai_run(text, jsonb) from public;
revoke all on function public.planner_confirm_ai_run(text, text, jsonb) from public;
revoke all on function public.planner_register_push(text, jsonb, text, text) from public;
revoke all on function public.planner_materialize_reminders(timestamptz) from public;
revoke all on function public.planner_claim_reminders(text, integer) from public;
revoke all on function public.planner_recurring_reminder_sources() from public;
revoke all on function public.planner_enqueue_reminders(jsonb) from public;
revoke all on function public.planner_finish_reminder(uuid, boolean, text) from public;

grant execute on function public.planner_pull_changes(text, bigint) to service_role;
grant execute on function public.planner_push_operations(text, jsonb, bigint) to service_role;
grant execute on function public.planner_save_ai_run(text, jsonb) to service_role;
grant execute on function public.planner_confirm_ai_run(text, text, jsonb) to service_role;
grant execute on function public.planner_register_push(text, jsonb, text, text) to service_role;
grant execute on function public.planner_materialize_reminders(timestamptz) to service_role;
grant execute on function public.planner_claim_reminders(text, integer) to service_role;
grant execute on function public.planner_recurring_reminder_sources() to service_role;
grant execute on function public.planner_enqueue_reminders(jsonb) to service_role;
grant execute on function public.planner_finish_reminder(uuid, boolean, text) to service_role;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.planner_configure_reminder_cron(
  p_edge_function_url text,
  p_cron_secret text
) returns void
language plpgsql
security definer
set search_path = public, vault, cron
as $$
declare
  v_existing bigint;
begin
  if p_edge_function_url !~ '^https://' or length(p_cron_secret) < 24 then
    raise exception 'invalid reminder cron configuration';
  end if;

  perform vault.create_secret(p_edge_function_url, 'planner_edge_function_url');
  perform vault.create_secret(p_cron_secret, 'planner_cron_secret');

  select jobid into v_existing from cron.job where jobname = 'planner-reminder-dispatch';
  if v_existing is not null then perform cron.unschedule(v_existing); end if;

  perform cron.schedule(
    'planner-reminder-dispatch',
    '* * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'planner_edge_function_url' order by created_at desc limit 1),
        headers := jsonb_build_object(
          'content-type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'planner_cron_secret' order by created_at desc limit 1)
        ),
        body := jsonb_build_object('scheduledAt', now())
      );
    $job$
  );
end;
$$;

revoke all on function public.planner_configure_reminder_cron(text, text) from public;
grant execute on function public.planner_configure_reminder_cron(text, text) to service_role;
begin;

-- v1 data was explicitly classified as test data. Reset the old generic model,
-- operation receipts and generated reminders before installing the execution model.
truncate table
  public.planner_reminder_deliveries,
  public.planner_reminders,
  public.planner_origin_links,
  public.planner_ai_suggestions,
  public.planner_ai_runs,
  public.planner_conflicts,
  public.planner_change_log,
  public.planner_sync_operations,
  public.planner_records
restart identity cascade;

alter table public.planner_records
  drop constraint if exists planner_records_entity_type_check;
alter table public.planner_records
  add constraint planner_records_entity_type_check check (
    entity_type in (
      'thought',
      'task',
      'event',
      'goal',
      'project',
      'projectNode',
      'scheduleBlock',
      'phase',
      'review',
      'fragmentActivity',
      'notification',
      'originLink',
      'aiRun',
      'settings'
    )
  );

alter table public.planner_origin_links
  drop constraint if exists planner_origin_links_target_type_check;
alter table public.planner_origin_links
  add constraint planner_origin_links_target_type_check check (
    target_type in ('task', 'event', 'goal', 'project', 'projectNode')
  );

alter table public.planner_reminders
  drop constraint if exists planner_reminders_kind_check;
alter table public.planner_reminders
  add constraint planner_reminders_kind_check check (
    kind in (
      'event_start',
      'course_start',
      'exam_start',
      'task_due',
      'assignment_desired',
      'assignment_deadline',
      'assignment_submit',
      'schedule_block',
      'recurrence',
      'daily_review',
      'weekly_review',
      'monthly_review',
      'inbox_stale'
    )
  );

create table if not exists public.planner_goals (
  owner_id text not null,
  id text not null,
  name text not null,
  sort_order integer not null,
  archived boolean not null default false,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_projects (
  owner_id text not null,
  id text not null,
  goal_id text not null,
  title text not null,
  status text not null check (status in ('active', 'paused', 'completed', 'abandoned')),
  sort_order integer not null,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create index if not exists planner_projects_goal_idx
  on public.planner_projects (owner_id, goal_id, sort_order);

create table if not exists public.planner_project_nodes (
  owner_id text not null,
  id text not null,
  project_id text not null,
  parent_id text,
  title text not null,
  sort_order integer not null,
  status text not null check (status in ('open', 'completed')),
  is_focused boolean not null default false,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create index if not exists planner_project_nodes_tree_idx
  on public.planner_project_nodes (owner_id, project_id, parent_id, sort_order);

create table if not exists public.planner_tasks_v2 (
  owner_id text not null,
  id text not null,
  task_kind text not null check (task_kind in ('ordinary', 'assignment')),
  title text not null,
  status text not null check (status in ('open', 'completed', 'deleted')),
  assignment_status text check (assignment_status in ('todo', 'content_done', 'submitted')),
  due_at timestamptz,
  desired_completion_at timestamptz,
  actual_deadline_at timestamptz,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_events_v2 (
  owner_id text not null,
  id text not null,
  event_kind text not null check (event_kind in ('event', 'course', 'exam')),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_schedule_blocks (
  owner_id text not null,
  id text not null,
  source_type text not null check (source_type in ('task', 'projectNode')),
  source_id text not null,
  schedule_date date not null,
  start_at timestamptz,
  end_at timestamptz,
  status text not null check (status in ('planned', 'performed', 'skipped')),
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create index if not exists planner_schedule_blocks_source_idx
  on public.planner_schedule_blocks (owner_id, source_type, source_id, schedule_date);

create table if not exists public.planner_phases (
  owner_id text not null,
  id text not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_reviews (
  owner_id text not null,
  id text not null,
  kind text not null check (kind in ('daily', 'weekly', 'monthly')),
  period_key text not null,
  snapshot jsonb not null,
  notes text not null default '',
  completed_at timestamptz,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_fragment_activities (
  owner_id text not null,
  id text not null,
  title text not null,
  duration_bucket text not null check (duration_bucket in ('10', '30', '60', 'long')),
  enabled boolean not null default true,
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id)
);

create table if not exists public.planner_origin_links_v2 (
  owner_id text not null,
  id text not null,
  source_entity_type text not null check (source_entity_type in ('thought', 'outline')),
  source_entity_id text not null,
  target_entity_type text not null check (
    target_entity_type in ('task', 'event', 'goal', 'project', 'projectNode')
  ),
  target_entity_id text not null,
  relationship text not null check (relationship in ('created_from', 'imported_from')),
  data jsonb not null,
  version integer not null,
  deleted_at timestamptz,
  updated_at timestamptz not null,
  primary key (owner_id, id),
  unique (
    owner_id,
    source_entity_type,
    source_entity_id,
    target_entity_type,
    target_entity_id
  )
);

create or replace function public.planner_project_domain_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb := new.record_data;
begin
  if new.deleted_at is not null then
    if new.entity_type = 'goal' then
      update public.planner_goals set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'project' then
      update public.planner_projects set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'projectNode' then
      update public.planner_project_nodes set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'task' then
      update public.planner_tasks_v2 set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'event' then
      update public.planner_events_v2 set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'scheduleBlock' then
      update public.planner_schedule_blocks set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'phase' then
      update public.planner_phases set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'review' then
      update public.planner_reviews set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'fragmentActivity' then
      update public.planner_fragment_activities set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    elsif new.entity_type = 'originLink' then
      update public.planner_origin_links_v2 set data = d, version = new.version,
        deleted_at = new.deleted_at, updated_at = new.updated_at
      where owner_id = new.owner_id and id = new.entity_id;
    end if;
    return new;
  end if;

  if new.entity_type = 'goal' then
    insert into public.planner_goals (
      owner_id, id, name, sort_order, archived, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'name', ''),
      coalesce((d ->> 'order')::integer, 0),
      coalesce((d ->> 'archived')::boolean, false),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      name = excluded.name,
      sort_order = excluded.sort_order,
      archived = excluded.archived,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'project' then
    insert into public.planner_projects (
      owner_id, id, goal_id, title, status, sort_order, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'goalId', ''),
      coalesce(d ->> 'title', ''), coalesce(d ->> 'status', 'active'),
      coalesce((d ->> 'order')::integer, 0),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      goal_id = excluded.goal_id,
      title = excluded.title,
      status = excluded.status,
      sort_order = excluded.sort_order,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'projectNode' then
    insert into public.planner_project_nodes (
      owner_id, id, project_id, parent_id, title, sort_order, status,
      is_focused, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'projectId', ''),
      nullif(d ->> 'parentId', ''), coalesce(d ->> 'title', ''),
      coalesce((d ->> 'order')::integer, 0), coalesce(d ->> 'status', 'open'),
      coalesce((d ->> 'isFocused')::boolean, false),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      project_id = excluded.project_id,
      parent_id = excluded.parent_id,
      title = excluded.title,
      sort_order = excluded.sort_order,
      status = excluded.status,
      is_focused = excluded.is_focused,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'task' then
    insert into public.planner_tasks_v2 (
      owner_id, id, task_kind, title, status, assignment_status, due_at,
      desired_completion_at, actual_deadline_at, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'taskKind', 'ordinary'),
      coalesce(d ->> 'title', ''), coalesce(d ->> 'status', 'open'),
      nullif(d ->> 'assignmentStatus', ''),
      nullif(d ->> 'dueAt', '')::timestamptz,
      nullif(d ->> 'desiredCompletionAt', '')::timestamptz,
      nullif(d ->> 'actualDeadlineAt', '')::timestamptz,
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      task_kind = excluded.task_kind,
      title = excluded.title,
      status = excluded.status,
      assignment_status = excluded.assignment_status,
      due_at = excluded.due_at,
      desired_completion_at = excluded.desired_completion_at,
      actual_deadline_at = excluded.actual_deadline_at,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'event' then
    insert into public.planner_events_v2 (
      owner_id, id, event_kind, title, start_at, end_at, timezone,
      data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'eventKind', 'event'),
      coalesce(d ->> 'title', ''), (d ->> 'startAt')::timestamptz,
      (d ->> 'endAt')::timestamptz, coalesce(d ->> 'timezone', 'Asia/Shanghai'),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      event_kind = excluded.event_kind,
      title = excluded.title,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      timezone = excluded.timezone,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'scheduleBlock' then
    insert into public.planner_schedule_blocks (
      owner_id, id, source_type, source_id, schedule_date, start_at, end_at,
      status, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, d ->> 'sourceType', d ->> 'sourceId',
      (d ->> 'date')::date, nullif(d ->> 'startAt', '')::timestamptz,
      nullif(d ->> 'endAt', '')::timestamptz, coalesce(d ->> 'status', 'planned'),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      source_type = excluded.source_type,
      source_id = excluded.source_id,
      schedule_date = excluded.schedule_date,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      status = excluded.status,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'phase' then
    insert into public.planner_phases (
      owner_id, id, title, start_date, end_date, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'title', ''),
      (d ->> 'startDate')::date, (d ->> 'endDate')::date,
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      title = excluded.title,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'review' then
    insert into public.planner_reviews (
      owner_id, id, kind, period_key, snapshot, notes, completed_at,
      data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, d ->> 'kind', d ->> 'periodKey',
      coalesce(d -> 'snapshot', '{}'::jsonb), coalesce(d ->> 'notes', ''),
      nullif(d ->> 'completedAt', '')::timestamptz,
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      snapshot = excluded.snapshot,
      notes = excluded.notes,
      completed_at = excluded.completed_at,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'fragmentActivity' then
    insert into public.planner_fragment_activities (
      owner_id, id, title, duration_bucket, enabled, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, coalesce(d ->> 'title', ''),
      coalesce(d ->> 'durationBucket', '10'),
      coalesce((d ->> 'enabled')::boolean, true),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      title = excluded.title,
      duration_bucket = excluded.duration_bucket,
      enabled = excluded.enabled,
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  elsif new.entity_type = 'originLink' then
    insert into public.planner_origin_links_v2 (
      owner_id, id, source_entity_type, source_entity_id, target_entity_type,
      target_entity_id, relationship, data, version, deleted_at, updated_at
    ) values (
      new.owner_id, new.entity_id, d ->> 'sourceEntityType',
      d ->> 'sourceEntityId', d ->> 'targetEntityType',
      d ->> 'targetEntityId', coalesce(d ->> 'relationship', 'created_from'),
      d, new.version, new.deleted_at, new.updated_at
    )
    on conflict (owner_id, id) do update set
      data = excluded.data,
      version = excluded.version,
      deleted_at = excluded.deleted_at,
      updated_at = excluded.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists planner_project_domain_record_trigger on public.planner_records;
create trigger planner_project_domain_record_trigger
after insert or update on public.planner_records
for each row execute function public.planner_project_domain_record();

alter table public.planner_goals enable row level security;
alter table public.planner_projects enable row level security;
alter table public.planner_project_nodes enable row level security;
alter table public.planner_tasks_v2 enable row level security;
alter table public.planner_events_v2 enable row level security;
alter table public.planner_schedule_blocks enable row level security;
alter table public.planner_phases enable row level security;
alter table public.planner_reviews enable row level security;
alter table public.planner_fragment_activities enable row level security;
alter table public.planner_origin_links_v2 enable row level security;

revoke all on function public.planner_project_domain_record() from public;

commit;
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
create or replace function public.planner_confirm_ai_run(
  p_owner text,
  p_run_id text,
  p_suggestions jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.planner_ai_runs%rowtype;
  v_suggestion jsonb;
  v_type text;
  v_target_id text;
  v_link_id text;
  v_record jsonb;
  v_link_record jsonb;
  v_thought_id text;
  v_timezone text;
  v_now timestamptz := now();
begin
  select * into v_run
  from public.planner_ai_runs
  where owner_id = p_owner and id = p_run_id
  for update;

  if not found then raise exception 'ai run not found'; end if;
  if v_run.status = 'confirmed' then return v_run.run_data; end if;

  select coalesce(record_data ->> 'timezone', 'Asia/Shanghai')
  into v_timezone
  from public.planner_records
  where owner_id = p_owner and entity_type = 'settings' and entity_id = 'main';
  v_timezone := coalesce(v_timezone, 'Asia/Shanghai');

  for v_suggestion in select value from jsonb_array_elements(p_suggestions)
  loop
    update public.planner_ai_suggestions
    set suggestion_data = v_suggestion,
        status = v_suggestion ->> 'status'
    where owner_id = p_owner
      and run_id = p_run_id
      and id = v_suggestion ->> 'id';

    if v_suggestion ->> 'status' <> 'accepted' then continue; end if;
    v_type := v_suggestion ->> 'type';

    if v_type in ('task', 'event') then
      v_target_id := v_type || '_' || gen_random_uuid()::text;
      if v_type = 'event' and nullif(v_suggestion ->> 'scheduledStartAt', '') is null then
        raise exception 'accepted event requires scheduledStartAt';
      end if;

      if v_type = 'task' then
        v_record := jsonb_build_object(
          'id', v_target_id,
          'entityType', 'task',
          'planningState',
            case
              when nullif(v_suggestion ->> 'dueAt', '') is null then 'draft'
              else 'planned'
            end,
          'taskKind', 'ordinary',
          'title', v_suggestion ->> 'title',
          'notes', coalesce(v_suggestion ->> 'rationale', ''),
          'status', 'open',
          'dueAt', v_suggestion -> 'dueAt',
          'scheduledStartAt', v_suggestion -> 'scheduledStartAt',
          'durationMinutes', v_suggestion -> 'durationMinutes',
          'needsContinuousTime', false,
          'isFragmentFriendly', false,
          'recurrenceRule', null,
          'reminderOffsetMinutes', null,
          'reminderRules', '[]'::jsonb,
          'assignmentStatus', null,
          'desiredCompletionAt', null,
          'actualDeadlineAt', null,
          'completedAt', null,
          'completedOccurrenceKeys', '[]'::jsonb,
          'originThoughtIds', coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb),
          'createdAt', v_now,
          'updatedAt', v_now,
          'version', 1
        );
      else
        v_record := jsonb_build_object(
          'id', v_target_id,
          'entityType', 'event',
          'eventKind', 'event',
          'title', v_suggestion ->> 'title',
          'notes', coalesce(v_suggestion ->> 'rationale', ''),
          'startAt', v_suggestion -> 'scheduledStartAt',
          'endAt', to_jsonb(
            (v_suggestion ->> 'scheduledStartAt')::timestamptz +
            make_interval(mins => coalesce((v_suggestion ->> 'durationMinutes')::integer, 30))
          ),
          'recurrenceRule', null,
          'recurrenceEndAt', null,
          'reminderOffsetMinutes', null,
          'reminderRules', '[]'::jsonb,
          'timezone', v_timezone,
          'originThoughtIds', coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb),
          'createdAt', v_now,
          'updatedAt', v_now,
          'version', 1
        );
      end if;

      insert into public.planner_records (
        owner_id, entity_type, entity_id, record_data, version, field_versions, created_at, updated_at
      ) values (
        p_owner, v_type, v_target_id, v_record, 1, '{}'::jsonb, v_now, v_now
      );
      insert into public.planner_change_log (
        owner_id, entity_type, entity_id, operation, record_data, version
      ) values (p_owner, v_type, v_target_id, 'upsert', v_record, 1);

      for v_thought_id in
        select jsonb_array_elements_text(coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb))
      loop
        insert into public.planner_origin_links (
          owner_id, thought_id, target_type, target_id, ai_run_id
        ) values (p_owner, v_thought_id, v_type, v_target_id, p_run_id)
        on conflict do nothing;

        v_link_id := 'origin_' || md5(
          p_run_id || ':' || (v_suggestion ->> 'id') || ':' || v_thought_id
        );
        v_link_record := jsonb_build_object(
          'id', v_link_id,
          'entityType', 'originLink',
          'sourceEntityType', 'thought',
          'sourceEntityId', v_thought_id,
          'targetEntityType', v_type,
          'targetEntityId', v_target_id,
          'relationship', 'created_from',
          'createdAt', v_now,
          'updatedAt', v_now,
          'version', 1
        );
        insert into public.planner_records (
          owner_id, entity_type, entity_id, record_data, version,
          field_versions, created_at, updated_at
        ) values (
          p_owner, 'originLink', v_link_id, v_link_record, 1, '{}'::jsonb, v_now, v_now
        ) on conflict (owner_id, entity_type, entity_id) do nothing;
        insert into public.planner_change_log (
          owner_id, entity_type, entity_id, operation, record_data, version
        ) values (
          p_owner, 'originLink', v_link_id, 'upsert', v_link_record, 1
        );
      end loop;

      update public.planner_ai_suggestions
      set created_entity_type = v_type, created_entity_id = v_target_id
      where owner_id = p_owner and run_id = p_run_id and id = v_suggestion ->> 'id';
    end if;

    for v_thought_id in
      select jsonb_array_elements_text(coalesce(v_suggestion -> 'thoughtIds', '[]'::jsonb))
    loop
      update public.planner_records
      set record_data = record_data || jsonb_build_object(
            'status', case when v_type = 'someday' then 'someday' else 'archived' end,
            'processedAt', v_now,
            'resultLabel',
              case
                when v_type = 'task' then '已转为任务'
                when v_type = 'event' then '已加入日程'
                when v_type = 'someday' then '以后再考虑'
                when v_type = 'discuss' then '需要进一步讨论'
                else '已归档'
              end,
            'updatedAt', v_now,
            'version', version + 1
          ),
          version = version + 1,
          updated_at = v_now
      where owner_id = p_owner and entity_type = 'thought' and entity_id = v_thought_id;

      insert into public.planner_change_log (
        owner_id, entity_type, entity_id, operation, record_data, version
      )
      select p_owner, 'thought', entity_id, 'upsert', record_data, version
      from public.planner_records
      where owner_id = p_owner and entity_type = 'thought' and entity_id = v_thought_id;
    end loop;
  end loop;

  update public.planner_ai_runs
  set status = 'confirmed',
      confirmed_at = v_now,
      updated_at = v_now,
      run_data = run_data || jsonb_build_object(
        'status', 'confirmed',
        'suggestions', p_suggestions,
        'updatedAt', v_now,
        'version', coalesce((run_data ->> 'version')::integer, 1) + 1
      )
  where owner_id = p_owner and id = p_run_id
  returning run_data into v_record;

  update public.planner_records
  set record_data = v_record, version = version + 1, updated_at = v_now
  where owner_id = p_owner and entity_type = 'aiRun' and entity_id = p_run_id;

  insert into public.planner_change_log (
    owner_id, entity_type, entity_id, operation, record_data, version
  )
  select p_owner, 'aiRun', entity_id, 'upsert', record_data, version
  from public.planner_records
  where owner_id = p_owner and entity_type = 'aiRun' and entity_id = p_run_id;

  return v_record;
end;
$$;

revoke all on function public.planner_confirm_ai_run(text, text, jsonb) from public;
grant execute on function public.planner_confirm_ai_run(text, text, jsonb) to service_role;
begin;

-- Product-state columns stay queryable without giving up the versioned JSON
-- record used by the offline synchronization protocol.
alter table public.planner_projects
  add column if not exists initialization_state text not null default 'ready';
alter table public.planner_projects
  drop constraint if exists planner_projects_initialization_state_check;
alter table public.planner_projects
  add constraint planner_projects_initialization_state_check
  check (initialization_state in ('draft', 'ready'));

alter table public.planner_tasks_v2
  add column if not exists planning_state text not null default 'planned';
alter table public.planner_tasks_v2
  drop constraint if exists planner_tasks_v2_planning_state_check;
alter table public.planner_tasks_v2
  add constraint planner_tasks_v2_planning_state_check
  check (planning_state in ('draft', 'planned'));

create index if not exists planner_projects_initialization_idx
  on public.planner_projects (owner_id, initialization_state, updated_at desc);
create index if not exists planner_tasks_v2_planning_idx
  on public.planner_tasks_v2 (owner_id, planning_state, updated_at desc);

create or replace function public.planner_apply_ux_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.entity_type = 'task' and not (new.record_data ? 'planningState') then
    new.record_data := jsonb_set(
      new.record_data,
      '{planningState}',
      to_jsonb(
        case
          when nullif(new.record_data ->> 'dueAt', '') is null then 'draft'
          else 'planned'
        end
      )
    );
  elsif new.entity_type = 'project' and not (new.record_data ? 'initializationState') then
    new.record_data := jsonb_set(
      new.record_data,
      '{initializationState}',
      to_jsonb('ready'::text)
    );
  elsif new.entity_type = 'thought' and new.record_data ->> 'status' = 'someday' then
    new.record_data := jsonb_set(new.record_data, '{status}', to_jsonb('inbox'::text));
  end if;
  return new;
end;
$$;

drop trigger if exists planner_apply_ux_defaults_trigger on public.planner_records;
create trigger planner_apply_ux_defaults_trigger
before insert or update on public.planner_records
for each row execute function public.planner_apply_ux_defaults();

create or replace function public.planner_refresh_ux_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'planner_projects' then
    new.initialization_state :=
      coalesce(new.data ->> 'initializationState', 'ready');
  elsif tg_table_name = 'planner_tasks_v2' then
    new.planning_state :=
      coalesce(
        new.data ->> 'planningState',
        case when new.due_at is null then 'draft' else 'planned' end
      );
  end if;
  return new;
end;
$$;

drop trigger if exists planner_projects_refresh_ux_state on public.planner_projects;
create trigger planner_projects_refresh_ux_state
before insert or update of data on public.planner_projects
for each row execute function public.planner_refresh_ux_state();

drop trigger if exists planner_tasks_v2_refresh_ux_state on public.planner_tasks_v2;
create trigger planner_tasks_v2_refresh_ux_state
before insert or update of data on public.planner_tasks_v2
for each row execute function public.planner_refresh_ux_state();

update public.planner_projects
set initialization_state = coalesce(data ->> 'initializationState', 'ready');

update public.planner_tasks_v2
set planning_state = coalesce(
  data ->> 'planningState',
  case when due_at is null then 'draft' else 'planned' end
);

update public.planner_records
set record_data = jsonb_set(record_data, '{status}', to_jsonb('inbox'::text))
where entity_type = 'thought' and record_data ->> 'status' = 'someday';

revoke all on function public.planner_apply_ux_defaults() from public;
revoke all on function public.planner_refresh_ux_state() from public;

commit;
begin;

-- Phase was removed from the product. Keep review snapshots intact, but remove
-- the live phase entities so older devices cannot synchronize them back.
delete from public.planner_change_log
where entity_type = 'phase';

delete from public.planner_sync_operations
where result -> 'conflict' ->> 'entityType' = 'phase';

delete from public.planner_records
where entity_type = 'phase';

drop table if exists public.planner_phases cascade;

alter table public.planner_records
  drop constraint if exists planner_records_entity_type_check;

alter table public.planner_records
  add constraint planner_records_entity_type_check check (
    entity_type in (
      'thought',
      'task',
      'event',
      'goal',
      'project',
      'projectNode',
      'scheduleBlock',
      'review',
      'fragmentActivity',
      'notification',
      'originLink',
      'aiRun',
      'settings'
    )
  );

commit;
do $$
declare
  changed_count integer;
begin
  raise notice 'Quiet Plan: normalizing task recommendation fields';
  update public.planner_records
  set record_data =
    record_data ||
    jsonb_build_object(
      'needsContinuousTime',
      coalesce((record_data ->> 'needsContinuousTime')::boolean, false),
      'isFragmentFriendly',
      case
        when coalesce((record_data ->> 'needsContinuousTime')::boolean, false) then false
        else coalesce((record_data ->> 'isFragmentFriendly')::boolean, false)
      end
    )
  where entity_type in ('task', 'projectNode')
    and deleted_at is null;
  get diagnostics changed_count = row_count;
  raise notice 'Quiet Plan: normalized % tasks and project nodes', changed_count;

  raise notice 'Quiet Plan: migrating fragment activity time choices';
  update public.planner_records
  set record_data =
    (record_data - 'durationBucket') ||
    jsonb_build_object(
      'eligibleMinutes',
      case record_data ->> 'durationBucket'
        when '10' then '[15]'::jsonb
        when '30' then '[30]'::jsonb
        when '60' then '[60]'::jsonb
        else '[90]'::jsonb
      end
    )
  where entity_type = 'fragmentActivity'
    and deleted_at is null
    and not (record_data ? 'eligibleMinutes');
  get diagnostics changed_count = row_count;
  raise notice 'Quiet Plan: migrated % fragment activities', changed_count;

  update public.planner_fragment_activities
  set data =
    (data - 'durationBucket') ||
    jsonb_build_object(
      'eligibleMinutes',
      case data ->> 'durationBucket'
        when '10' then '[15]'::jsonb
        when '30' then '[30]'::jsonb
        when '60' then '[60]'::jsonb
        else '[90]'::jsonb
      end
    )
  where deleted_at is null
    and not (data ? 'eligibleMinutes');
  get diagnostics changed_count = row_count;
  raise notice 'Quiet Plan: updated % fragment activity projections', changed_count;
end;
$$;
begin;

delete from public.planner_reminder_deliveries
where reminder_id in (
  select id
  from public.planner_reminders
  where kind in ('daily_review', 'weekly_review', 'monthly_review')
);

delete from public.planner_reminders
where kind in ('daily_review', 'weekly_review', 'monthly_review');

delete from public.planner_sync_operations
where result -> 'conflict' ->> 'entityType' = 'review';

delete from public.planner_records
where entity_type = 'review';

delete from public.planner_change_log
where entity_type = 'review';

update public.planner_records
set
  record_data = record_data
    - 'reviewTime'
    - 'weeklyReviewTime'
    - 'monthlyReviewTime'
    - 'dailyReviewEnabled'
    - 'weeklyReviewEnabled'
    - 'monthlyReviewEnabled',
  version = version + 1,
  updated_at = now()
where entity_type = 'settings'
  and entity_id = 'main';

drop table if exists public.planner_reviews cascade;

alter table public.planner_records
  drop constraint if exists planner_records_entity_type_check;

alter table public.planner_records
  add constraint planner_records_entity_type_check check (
    entity_type in (
      'thought',
      'task',
      'event',
      'goal',
      'project',
      'projectNode',
      'scheduleBlock',
      'fragmentActivity',
      'notification',
      'originLink',
      'aiRun',
      'settings'
    )
  );

alter table public.planner_reminders
  drop constraint if exists planner_reminders_kind_check;

alter table public.planner_reminders
  add constraint planner_reminders_kind_check check (
    kind in (
      'event_start',
      'course_start',
      'exam_start',
      'task_due',
      'assignment_desired',
      'assignment_deadline',
      'assignment_submit',
      'schedule_block',
      'recurrence',
      'inbox_stale'
    )
  );

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
      and kind in ('inbox_stale', 'recurrence');
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

commit;
-- Deleted links are sync tombstones: retaining them must not prevent a new
-- link for the same source and target. No planner records or history is removed.
begin;

do $$
declare
  constraint_name text;
begin
  select c.conname into strict constraint_name
  from pg_constraint c
  where c.conrelid = 'public.planner_origin_links_v2'::regclass
    and c.contype = 'u'
    and (
      select array_agg(a.attname::text order by k.ordinality)
      from unnest(c.conkey) with ordinality k(attnum, ordinality)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    ) = array[
      'owner_id', 'source_entity_type', 'source_entity_id',
      'target_entity_type', 'target_entity_id'
    ];

  execute format('alter table public.planner_origin_links_v2 drop constraint %I', constraint_name);
end;
$$;

create unique index planner_origin_links_v2_live_source_target_key
  on public.planner_origin_links_v2 (
    owner_id, source_entity_type, source_entity_id,
    target_entity_type, target_entity_id
  ) where deleted_at is null;

commit;
alter table public.planner_tasks_v2
  drop constraint if exists planner_tasks_v2_status_check;

alter table public.planner_tasks_v2
  add constraint planner_tasks_v2_status_check
  check (status in ('open', 'completed', 'failed', 'deleted'));
