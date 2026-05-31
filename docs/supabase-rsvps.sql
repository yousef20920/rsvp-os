drop schema if exists public cascade;
create schema public;

revoke all on schema public from public;
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant all on schema public to postgres, service_role;

create extension if not exists "pgcrypto" with schema extensions;

create function public.valid_guest_names(names text[])
returns boolean
language sql
immutable
as $$
  with normalized as (
    select lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) as name
    from unnest(names) as name
  )
  select
    coalesce(
      bool_and(
        name = lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
        and length(name) between 5 and 160
        and (name like '% (male)' or name like '% (female)')
      ),
      cardinality(names) = 0
    )
    and cardinality(names) = (select count(distinct name) from normalized)
  from normalized;
$$;

create table public.rsvps (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (first_name = btrim(first_name) and length(first_name) between 1 and 80),
  last_name text not null check (last_name = btrim(last_name) and length(last_name) between 1 and 80),
  is_attending boolean not null,
  party_size integer not null default 0 check (party_size between 0 and 20),
  male_guests integer not null default 0 check (male_guests between 0 and 20),
  female_guests integer not null default 0 check (female_guests between 0 and 20),
  guest_names text[] not null default '{}',
  constraint rsvps_attending_party_size_check check (
    (is_attending = false and party_size = 0 and male_guests = 0 and female_guests = 0 and cardinality(guest_names) = 0)
    or
    (is_attending = true and party_size >= 1 and male_guests + female_guests = party_size and cardinality(guest_names) = party_size)
  ),
  constraint rsvps_guest_names_content_check check (public.valid_guest_names(guest_names)),
  constraint rsvps_created_at_reasonable_check check (created_at <= now() + interval '5 minutes')
);

alter table public.rsvps enable row level security;
alter table public.rsvps force row level security;

create policy "Anyone can submit an RSVP"
on public.rsvps
for insert
to anon, authenticated
with check (
  first_name = btrim(first_name)
  and last_name = btrim(last_name)
  and length(first_name) between 1 and 80
  and length(last_name) between 1 and 80
  and party_size between 0 and 20
  and male_guests between 0 and 20
  and female_guests between 0 and 20
  and public.valid_guest_names(guest_names)
  and (
    (is_attending = false and party_size = 0 and male_guests = 0 and female_guests = 0 and cardinality(guest_names) = 0)
    or
    (is_attending = true and party_size >= 1 and male_guests + female_guests = party_size and cardinality(guest_names) = party_size)
  )
);

create policy "Only the admin can view RSVPs"
on public.rsvps
for select
to authenticated
using (lower(auth.jwt() ->> 'email') = 'yousef.hadi.cs@gmail.com');

revoke all on public.rsvps from public;
revoke all on public.rsvps from anon;
revoke all on public.rsvps from authenticated;
grant insert (
  first_name,
  last_name,
  is_attending,
  party_size,
  male_guests,
  female_guests,
  guest_names
) on public.rsvps to anon;
grant insert (
  first_name,
  last_name,
  is_attending,
  party_size,
  male_guests,
  female_guests,
  guest_names
) on public.rsvps to authenticated;
grant select (
  id,
  created_at,
  first_name,
  last_name,
  is_attending,
  party_size,
  male_guests,
  female_guests,
  guest_names
) on public.rsvps to authenticated;
grant all on public.rsvps to postgres, service_role;
grant execute on function public.valid_guest_names(text[]) to anon, authenticated, service_role;

create index rsvps_created_at_idx on public.rsvps (created_at desc);
create unique index rsvps_unique_primary_guest_idx
on public.rsvps (
  lower(regexp_replace(btrim(first_name), '\s+', ' ', 'g')),
  lower(regexp_replace(btrim(last_name), '\s+', ' ', 'g'))
);
