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
