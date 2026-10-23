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
