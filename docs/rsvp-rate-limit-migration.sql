create table if not exists public.rsvp_rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  blocked_until timestamptz
);

create or replace function public.consume_rsvp_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_requests integer,
  p_block_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_limit public.rsvp_rate_limits%rowtype;
  current_time timestamptz := now();
  next_count integer;
begin
  insert into public.rsvp_rate_limits (bucket, window_start, request_count)
  values (p_bucket, current_time, 0)
  on conflict (bucket) do nothing;

  select *
  into current_limit
  from public.rsvp_rate_limits
  where bucket = p_bucket
  for update;

  if current_limit.blocked_until is not null and current_limit.blocked_until > current_time then
    return false;
  end if;

  if current_limit.window_start <= current_time - make_interval(secs => p_window_seconds) then
    update public.rsvp_rate_limits
    set window_start = current_time,
        request_count = 1,
        blocked_until = null
    where bucket = p_bucket;
    return true;
  end if;

  next_count := current_limit.request_count + 1;

  update public.rsvp_rate_limits
  set request_count = next_count,
      blocked_until = case
        when next_count > p_max_requests then current_time + make_interval(secs => p_block_seconds)
        else null
      end
  where bucket = p_bucket;

  return next_count <= p_max_requests;
end;
$$;

revoke all on public.rsvps from anon;
revoke all on public.rsvps from authenticated;

revoke all on public.rsvp_rate_limits from public;
revoke all on public.rsvp_rate_limits from anon;
revoke all on public.rsvp_rate_limits from authenticated;
grant all on public.rsvp_rate_limits to postgres, service_role;
grant execute on function public.consume_rsvp_rate_limit(text, integer, integer, integer) to service_role;
