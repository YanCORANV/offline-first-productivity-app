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
