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
