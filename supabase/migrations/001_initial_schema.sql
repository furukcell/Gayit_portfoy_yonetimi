-- GAYIT initial schema (Supabase/Postgres)
-- Apply through Supabase SQL Editor or Supabase CLI migrations.
-- Never put the service_role key in a mobile app.

create extension if not exists pgcrypto;

create type public.office_role as enum ('owner', 'agent');
create type public.office_member_status as enum ('invited', 'active', 'disabled');
create type public.property_listing_type as enum ('sale', 'rent');
create type public.property_status as enum ('active', 'optioned', 'sold', 'rented', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_members (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role public.office_role not null default 'agent',
  status public.office_member_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint office_member_identity_check check (user_id is not null or invited_email is not null)
);

create unique index office_members_user_unique
  on public.office_members(office_id, user_id) where user_id is not null;
create unique index office_members_invited_email_unique
  on public.office_members(office_id, lower(invited_email)) where invited_email is not null and status = 'invited';

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  owner_agent_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) between 3 and 160),
  description text not null default '',
  listing_type public.property_listing_type not null,
  status public.property_status not null default 'active',
  price numeric(14,2) not null check (price >= 0),
  currency char(3) not null default 'TRY',
  rooms text not null default '',
  area_m2 numeric(10,2) check (area_m2 is null or area_m2 > 0),
  address text not null default '',
  city text not null default '',
  district text not null default '',
  neighborhood text not null default '',
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_office_created_idx on public.properties(office_id, created_at desc);
create index properties_agent_created_idx on public.properties(owner_agent_id, created_at desc);
create index properties_office_status_idx on public.properties(office_id, status);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index property_photos_property_order_idx on public.property_photos(property_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger offices_set_updated_at before update on public.offices
for each row execute function public.set_updated_at();
create trigger office_members_set_updated_at before update on public.office_members
for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();

-- Create a profile for every newly registered auth user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Create the owner's active membership when an office is created.
create or replace function public.handle_new_office()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.office_members (office_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');
  return new;
end;
$$;

create trigger on_office_created
after insert on public.offices
for each row execute function public.handle_new_office();

-- Security-definer helpers avoid recursive RLS evaluation on office_members.
create or replace function public.is_active_office_member(target_office uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.office_members m
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.is_office_owner(target_office uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.office_members m
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
  );
$$;

create or replace function public.is_office_agent(target_office uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.office_members m
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.role = 'agent'
      and m.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.offices enable row level security;
alter table public.office_members enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;

create policy "profiles_select_self_or_colleagues"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1 from public.office_members mine
    join public.office_members theirs on theirs.office_id = mine.office_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = profiles.id
      and theirs.status = 'active'
  )
);

create policy "profiles_update_self"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "offices_select_members"
on public.offices for select to authenticated
using (public.is_active_office_member(id));

create policy "offices_insert_as_owner"
on public.offices for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "offices_update_owner"
on public.offices for update to authenticated
using (public.is_office_owner(id))
with check (public.is_office_owner(id) and owner_id = (select auth.uid()));

create policy "office_members_select_same_office"
on public.office_members for select to authenticated
using (public.is_active_office_member(office_id));

create policy "office_members_owner_insert"
on public.office_members for insert to authenticated
with check (public.is_office_owner(office_id));

create policy "office_members_owner_update"
on public.office_members for update to authenticated
using (public.is_office_owner(office_id))
with check (public.is_office_owner(office_id));

create policy "office_members_owner_delete"
on public.office_members for delete to authenticated
using (public.is_office_owner(office_id));

create policy "properties_select_by_role"
on public.properties for select to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and owner_agent_id = (select auth.uid()))
);

create policy "properties_insert_by_role"
on public.properties for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (public.is_office_owner(office_id) and owner_agent_id in (
      select m.user_id from public.office_members m
      where m.office_id = properties.office_id and m.status = 'active'
    ))
    or (public.is_office_agent(office_id) and owner_agent_id = (select auth.uid()))
  )
);

create policy "properties_update_by_role"
on public.properties for update to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and owner_agent_id = (select auth.uid()))
)
with check (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and owner_agent_id = (select auth.uid()))
);

create policy "properties_delete_by_role"
on public.properties for delete to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and owner_agent_id = (select auth.uid()))
);

create policy "property_photos_select_by_role"
on public.property_photos for select to authenticated
using (
  public.is_office_owner(office_id)
  or (
    public.is_office_agent(office_id)
    and exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_agent_id = (select auth.uid())
    )
  )
);

create policy "property_photos_insert_by_role"
on public.property_photos for insert to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_photos.property_id
      and p.office_id = property_photos.office_id
      and (
        public.is_office_owner(p.office_id)
        or (public.is_office_agent(p.office_id) and p.owner_agent_id = (select auth.uid()))
      )
  )
);

create policy "property_photos_delete_by_role"
on public.property_photos for delete to authenticated
using (
  public.is_office_owner(office_id)
  or (
    public.is_office_agent(office_id)
    and exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_agent_id = (select auth.uid())
    )
  )
);
