-- Make account/office suspension effective for all RLS-protected client operations.
-- Apply after migrations 001-006.

create or replace function public.is_active_office_member(target_office uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.office_members m
    join public.profiles p on p.id = m.user_id
    join public.offices o on o.id = m.office_id
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and p.account_status = 'active'
      and o.is_active = true
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
    select 1
    from public.office_members m
    join public.profiles p on p.id = m.user_id
    join public.offices o on o.id = m.office_id
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
      and p.account_status = 'active'
      and o.is_active = true
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
    select 1
    from public.office_members m
    join public.profiles p on p.id = m.user_id
    join public.offices o on o.id = m.office_id
    where m.office_id = target_office
      and m.user_id = (select auth.uid())
      and m.role = 'agent'
      and m.status = 'active'
      and p.account_status = 'active'
      and o.is_active = true
  );
$$;

-- The direct table insert path must not bypass the status checks in create-office.
drop policy if exists offices_insert_as_owner on public.offices;
create policy offices_insert_as_owner
on public.offices for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.account_status = 'active'
  )
);

-- Preserve the identity of the user who recorded a CRM activity.
create or replace function public.protect_customer_activity_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Customer activity creator is immutable';
  end if;
  return new;
end;
$$;

create trigger customer_activities_protect_creator
before update on public.customer_activities
for each row execute function public.protect_customer_activity_creator();
