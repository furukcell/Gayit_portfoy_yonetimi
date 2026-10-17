-- Private property photo storage. Object path: <office_uuid>/<property_uuid>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-photos', 'property-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "office_members_read_property_photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-photos'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.properties p
    where p.id = ((storage.foldername(name))[2])::uuid
      and p.office_id = ((storage.foldername(name))[1])::uuid
      and (
        public.is_office_owner(p.office_id)
        or (public.is_office_agent(p.office_id) and p.owner_agent_id = (select auth.uid()))
      )
  )
);

create policy "office_members_upload_property_photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'property-photos'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.properties p
    where p.id = ((storage.foldername(name))[2])::uuid
      and p.office_id = ((storage.foldername(name))[1])::uuid
      and (
        public.is_office_owner(p.office_id)
        or (public.is_office_agent(p.office_id) and p.owner_agent_id = (select auth.uid()))
      )
  )
);

create policy "office_members_delete_property_photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'property-photos'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.properties p
    where p.id = ((storage.foldername(name))[2])::uuid
      and p.office_id = ((storage.foldername(name))[1])::uuid
      and (
        public.is_office_owner(p.office_id)
        or (public.is_office_agent(p.office_id) and p.owner_agent_id = (select auth.uid()))
      )
  )
);
