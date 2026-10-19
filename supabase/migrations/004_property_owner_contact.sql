-- Add private owner contact fields to property records.
-- Apply this migration in the Supabase SQL editor before deploying the app update.
alter table public.properties
  add column if not exists owner_contact_name text,
  add column if not exists owner_contact_phone text;

comment on column public.properties.owner_contact_name is 'Private owner contact name; do not expose in public listing or PDF.';
comment on column public.properties.owner_contact_phone is 'Private owner contact phone; do not expose in public listing or PDF.';
