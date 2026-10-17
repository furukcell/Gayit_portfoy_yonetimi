-- Close direct membership attachment paths left by client-facing membership policies.
-- Apply after migrations 001-009. Account creation Edge Functions use service_role.

drop policy if exists office_members_owner_insert_agent on public.office_members;
create policy office_members_owner_insert_agent
on public.office_members for insert to authenticated
with check (
  public.is_office_owner(office_id)
  and role = 'agent'
  and status = 'invited'
  and user_id is null
  and invited_email is not null
  and length(trim(invited_email)) > 3
);

create or replace function public.protect_office_member_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.office_id is distinct from old.office_id then
    raise exception 'Office membership office_id is immutable';
  end if;

  if new.role is distinct from old.role then
    raise exception 'Office membership role is immutable';
  end if;

  if new.invited_email is distinct from old.invited_email then
    raise exception 'Office membership invited_email is immutable';
  end if;

  -- Only trusted server functions may attach an account to an existing invite.
  -- Client-side updates must never bind an arbitrary existing profile to an invite.
  if new.user_id is distinct from old.user_id
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Office membership user_id can only be changed by a trusted server function';
  end if;

  return new;
end;
$$;
