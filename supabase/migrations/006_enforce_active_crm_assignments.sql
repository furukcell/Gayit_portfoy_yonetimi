-- Enforce active-office and active-profile assignment rules for CRM records.
-- Apply after migrations 001-005.

create or replace function public.validate_customer_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.offices o
    join public.office_members m on m.office_id = o.id
    join public.profiles p on p.id = m.user_id
    where o.id = new.office_id
      and o.is_active = true
      and m.user_id = new.assigned_agent_id
      and m.role in ('owner', 'agent')
      and m.status = 'active'
      and p.account_status = 'active'
  ) then
    raise exception 'Assigned user and office must both be active members of the same office';
  end if;

  -- Preserve audit attribution after creation; it must not be reassigned by clients.
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'Customer created_by is immutable';
  end if;

  return new;
end;
$$;

create or replace function public.validate_appointment_office()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.offices o
    where o.id = new.office_id
      and o.is_active = true
  ) then
    raise exception 'Appointment office must be active';
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = new.customer_id
      and c.office_id = new.office_id
  ) then
    raise exception 'Customer must belong to the same office';
  end if;

  if new.property_id is not null and not exists (
    select 1
    from public.properties p
    where p.id = new.property_id
      and p.office_id = new.office_id
  ) then
    raise exception 'Property must belong to the same office';
  end if;

  if not exists (
    select 1
    from public.office_members m
    join public.profiles p on p.id = m.user_id
    where m.office_id = new.office_id
      and m.user_id = new.assigned_agent_id
      and m.role in ('owner', 'agent')
      and m.status = 'active'
      and p.account_status = 'active'
  ) then
    raise exception 'Appointment assignee must be an active member of the same office';
  end if;

  return new;
end;
$$;
