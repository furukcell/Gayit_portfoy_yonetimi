-- Prevent owners from moving an existing membership to another office or
-- attaching an existing agent account to a different membership identity.
-- Apply after migrations 001-007.

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

  if old.user_id is not null and new.user_id is distinct from old.user_id then
    raise exception 'Linked office membership user_id is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists office_members_protect_identity on public.office_members;
create trigger office_members_protect_identity
before update on public.office_members
for each row execute function public.protect_office_member_identity();
