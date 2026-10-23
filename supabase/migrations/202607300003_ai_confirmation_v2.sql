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
