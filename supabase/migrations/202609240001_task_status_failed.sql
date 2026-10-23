alter table public.planner_tasks_v2
  drop constraint if exists planner_tasks_v2_status_check;

alter table public.planner_tasks_v2
  add constraint planner_tasks_v2_status_check
  check (status in ('open', 'completed', 'failed', 'deleted'));
