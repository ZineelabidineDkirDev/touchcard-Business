grant usage on schema private to service_role;
grant all on public.workspace_requests to service_role;
grant all on public.workspace_request_rate_limits to service_role;
grant execute on function private.consume_workspace_request_rate_limit(text, integer, integer) to service_role;
revoke update on public.workspace_requests from authenticated;
grant update(status, updated_at) on public.workspace_requests to authenticated;
