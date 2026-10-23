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
