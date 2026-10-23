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
