create or replace function public.consume_workspace_request_rate_limit(p_ip_hash text, p_limit integer default 12, p_window_seconds integer default 3600)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare allowed boolean;
begin
  insert into public.workspace_request_rate_limits(ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update
  set window_started_at = case
        when public.workspace_request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
        else public.workspace_request_rate_limits.window_started_at end,
      request_count = case
        when public.workspace_request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
        else public.workspace_request_rate_limits.request_count + 1 end;
  select request_count <= p_limit into allowed
  from public.workspace_request_rate_limits where ip_hash = p_ip_hash;
  return coalesce(allowed, false);
end;
$$;
revoke all on function public.consume_workspace_request_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_workspace_request_rate_limit(text, integer, integer) to service_role;
