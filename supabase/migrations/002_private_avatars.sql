-- Private avatar storage for office owners and agents.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

-- Compare UUID folder names as text instead of casting user-controlled paths to
-- uuid. PostgreSQL may reorder AND predicates, so a regex guard is not a safe
-- guarantee that a cast will never receive malformed input.
create policy "office_members_read_office_avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.office_members m
    where lower(m.office_id::text) = lower((storage.foldername(name))[1])
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

create policy "office_owners_upload_avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.office_members m
    join public.offices o on o.id = m.office_id
    where lower(m.office_id::text) = lower((storage.foldername(name))[1])
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
      and o.is_active = true
      and o.owner_id = (select auth.uid())
  )
);

create policy "office_owners_update_avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.office_members m
    join public.offices o on o.id = m.office_id
    where lower(m.office_id::text) = lower((storage.foldername(name))[1])
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
      and o.is_active = true
      and o.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.office_members m
    join public.offices o on o.id = m.office_id
    where lower(m.office_id::text) = lower((storage.foldername(name))[1])
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
      and o.is_active = true
      and o.owner_id = (select auth.uid())
  )
);

create policy "office_owners_delete_avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.office_members m
    join public.offices o on o.id = m.office_id
    where lower(m.office_id::text) = lower((storage.foldername(name))[1])
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.status = 'active'
      and o.is_active = true
      and o.owner_id = (select auth.uid())
  )
);
