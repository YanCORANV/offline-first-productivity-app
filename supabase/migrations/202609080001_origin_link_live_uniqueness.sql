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
