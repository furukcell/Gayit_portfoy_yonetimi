-- GAYIT customer CRM, requirements, match history and notifications.
-- Apply after 001_initial_schema.sql and 002_private_avatars.sql.
-- Matching computation can be implemented in a trusted Edge Function after schema review.

create type public.customer_activity_type as enum (
  'call', 'whatsapp', 'meeting', 'property_viewing', 'note', 'email', 'other'
);
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.match_status as enum (
  'new', 'reviewed', 'shared', 'interested', 'not_interested', 'closed'
);
create type public.notification_type as enum (
  'new_match', 'appointment_reminder', 'customer_follow_up', 'system'
);

-- Extend properties without breaking existing records.
alter table public.properties
  add column if not exists property_type text not null default 'other',
  add column if not exists bedrooms_label text not null default '';

alter table public.properties
  add constraint properties_property_type_check
  check (property_type in ('apartment', 'villa', 'land', 'commercial', 'house', 'other'));

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  assigned_agent_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  phone text not null default '',
  email text not null default '',
  roles text[] not null default array['buyer']::text[],
  notes text not null default '',
  is_active boolean not null default true,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_roles_check check (
    cardinality(roles) > 0
    and roles <@ array['buyer','seller','tenant','landlord','investor']::text[]
  )
);

create index customers_office_agent_idx on public.customers(office_id, assigned_agent_id, created_at desc);
create index customers_office_active_idx on public.customers(office_id, is_active, created_at desc);
create index customers_follow_up_idx on public.customers(assigned_agent_id, next_follow_up_at)
  where next_follow_up_at is not null;

create table public.customer_requirements (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  intent public.property_listing_type not null,
  property_type text not null default 'any'
    check (property_type in ('any','apartment','villa','land','commercial','house','other')),
  city text not null default '',
  district text not null default '',
  neighborhood text not null default '',
  min_price numeric(14,2) check (min_price is null or min_price >= 0),
  max_price numeric(14,2) check (max_price is null or max_price >= 0),
  min_area_m2 numeric(10,2) check (min_area_m2 is null or min_area_m2 > 0),
  max_area_m2 numeric(10,2) check (max_area_m2 is null or max_area_m2 > 0),
  rooms text[] not null default '{}',
  must_have text[] not null default '{}',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_requirements_price_range_check
    check (min_price is null or max_price is null or min_price <= max_price),
  constraint customer_requirements_area_range_check
    check (min_area_m2 is null or max_area_m2 is null or min_area_m2 <= max_area_m2)
);

create index customer_requirements_customer_idx on public.customer_requirements(customer_id, is_active);
create index customer_requirements_search_idx on public.customer_requirements(office_id, intent, is_active);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  requirement_id uuid not null references public.customer_requirements(id) on delete cascade,
  assigned_agent_id uuid not null references public.profiles(id) on delete restrict,
  status public.match_status not null default 'new',
  match_score integer check (match_score is null or match_score between 0 and 100),
  match_reasons text[] not null default '{}',
  first_notified_at timestamptz,
  last_notified_at timestamptz,
  shared_at timestamptz,
  customer_feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_one_per_requirement_property unique (requirement_id, property_id)
);

create index matches_agent_status_idx on public.matches(assigned_agent_id, status, created_at desc);
create index matches_office_status_idx on public.matches(office_id, status, created_at desc);
create index matches_property_idx on public.matches(property_id, created_at desc);
create index matches_customer_idx on public.matches(customer_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type public.notification_type not null default 'system',
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null default '',
  match_id uuid references public.matches(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_unread_idx on public.notifications(recipient_user_id, created_at desc)
  where read_at is null;

create table public.customer_activities (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  activity_type public.customer_activity_type not null,
  summary text not null check (length(trim(summary)) between 1 and 500),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index customer_activities_timeline_idx on public.customer_activities(customer_id, occurred_at desc);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  assigned_agent_id uuid not null references public.profiles(id) on delete restrict,
  title text not null default 'Müşteri görüşmesi',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  notes text not null default '',
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_range_check check (ends_at is null or ends_at > starts_at)
);

create index appointments_agent_date_idx on public.appointments(assigned_agent_id, starts_at);
create index appointments_office_date_idx on public.appointments(office_id, starts_at);

-- Ensure the customer, requirement, property and match all belong to the same office.
create or replace function public.validate_customer_requirement_office()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.customers c
    where c.id = new.customer_id and c.office_id = new.office_id
  ) then raise exception 'Customer must belong to the same office'; end if;
  return new;
end;
$$;
create trigger customer_requirements_validate_office
before insert or update on public.customer_requirements
for each row execute function public.validate_customer_requirement_office();

create or replace function public.validate_match_office()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.properties p
    where p.id = new.property_id and p.office_id = new.office_id
  ) then raise exception 'Property must belong to the same office'; end if;
  if not exists (
    select 1 from public.customers c
    where c.id = new.customer_id and c.office_id = new.office_id
      and c.assigned_agent_id = new.assigned_agent_id
  ) then raise exception 'Customer and assigned agent must belong to the same office'; end if;
  if not exists (
    select 1 from public.customer_requirements r
    where r.id = new.requirement_id and r.office_id = new.office_id
      and r.customer_id = new.customer_id
  ) then raise exception 'Requirement must belong to the same customer and office'; end if;
  return new;
end;
$$;
create trigger matches_validate_office
before insert or update on public.matches
for each row execute function public.validate_match_office();

create or replace function public.validate_customer_activity_office()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from public.customers c where c.id = new.customer_id and c.office_id = new.office_id)
    then raise exception 'Customer must belong to the same office'; end if;
  if new.property_id is not null and not exists (
    select 1 from public.properties p where p.id = new.property_id and p.office_id = new.office_id
  ) then raise exception 'Property must belong to the same office'; end if;
  return new;
end;
$$;
create trigger customer_activities_validate_office
before insert or update on public.customer_activities
for each row execute function public.validate_customer_activity_office();

create or replace function public.validate_appointment_office()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from public.customers c where c.id = new.customer_id and c.office_id = new.office_id)
    then raise exception 'Customer must belong to the same office'; end if;
  if new.property_id is not null and not exists (
    select 1 from public.properties p where p.id = new.property_id and p.office_id = new.office_id
  ) then raise exception 'Property must belong to the same office'; end if;
  return new;
end;
$$;
create trigger appointments_validate_office
before insert or update on public.appointments
for each row execute function public.validate_appointment_office();

create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
create trigger customer_requirements_set_updated_at before update on public.customer_requirements
for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.customer_requirements enable row level security;
alter table public.matches enable row level security;
alter table public.notifications enable row level security;
alter table public.customer_activities enable row level security;
alter table public.appointments enable row level security;

-- Office owners can access office-wide CRM data; agents can access only records assigned to them.
create policy customers_select_by_role on public.customers for select to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));
create policy customers_insert_by_role on public.customers for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (public.is_office_owner(office_id) and exists (
      select 1 from public.office_members m where m.office_id = customers.office_id
        and m.user_id = customers.assigned_agent_id and m.status = 'active'
    ))
    or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid()))
  )
);
create policy customers_update_by_role on public.customers for update to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())))
with check (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));
create policy customers_delete_by_role on public.customers for delete to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));

create policy customer_requirements_select_by_role on public.customer_requirements for select to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id
      and c.assigned_agent_id = (select auth.uid())
  ))
);
create policy customer_requirements_insert_by_role on public.customer_requirements for insert to authenticated
with check (
  (public.is_office_owner(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id
      and c.office_id = customer_requirements.office_id
  ))
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id
      and c.office_id = customer_requirements.office_id and c.assigned_agent_id = (select auth.uid())
  ))
);
create policy customer_requirements_update_by_role on public.customer_requirements for update to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id and c.assigned_agent_id = (select auth.uid())
  ))
)
with check (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id and c.assigned_agent_id = (select auth.uid())
  ))
);
create policy customer_requirements_delete_by_role on public.customer_requirements for delete to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_requirements.customer_id and c.assigned_agent_id = (select auth.uid())
  ))
);

create policy matches_select_by_role on public.matches for select to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid()))
);
create policy matches_insert_by_role on public.matches for insert to authenticated
with check (
  (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())))
  and exists (select 1 from public.properties p where p.id = matches.property_id and p.office_id = matches.office_id)
  and exists (select 1 from public.customers c where c.id = matches.customer_id and c.office_id = matches.office_id)
);
create policy matches_update_by_role on public.matches for update to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())))
with check (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));

create policy notifications_select_recipient on public.notifications for select to authenticated
using (recipient_user_id = (select auth.uid()) and public.is_active_office_member(office_id));
create policy notifications_update_recipient on public.notifications for update to authenticated
using (recipient_user_id = (select auth.uid()) and public.is_active_office_member(office_id))
with check (recipient_user_id = (select auth.uid()) and public.is_active_office_member(office_id));

create policy customer_activities_select_by_role on public.customer_activities for select to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and exists (
    select 1 from public.customers c where c.id = customer_activities.customer_id and c.assigned_agent_id = (select auth.uid())
  ))
);
create policy customer_activities_insert_by_role on public.customer_activities for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    public.is_office_owner(office_id)
    or (public.is_office_agent(office_id) and exists (
      select 1 from public.customers c where c.id = customer_activities.customer_id and c.assigned_agent_id = (select auth.uid())
    ))
  )
);
create policy customer_activities_update_by_role on public.customer_activities for update to authenticated
using (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and created_by = (select auth.uid()))
)
with check (
  public.is_office_owner(office_id)
  or (public.is_office_agent(office_id) and created_by = (select auth.uid()))
);

create policy appointments_select_by_role on public.appointments for select to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));
create policy appointments_insert_by_role on public.appointments for insert to authenticated
with check (
  (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())))
  and exists (select 1 from public.customers c where c.id = appointments.customer_id and c.office_id = appointments.office_id)
);
create policy appointments_update_by_role on public.appointments for update to authenticated
using (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())))
with check (public.is_office_owner(office_id) or (public.is_office_agent(office_id) and assigned_agent_id = (select auth.uid())));
