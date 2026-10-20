-- Structured property location fields for address search and map coordinates.
alter table public.properties
  add column if not exists neighborhood text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- Preserve older listings by keeping existing city/district/address values.
update public.properties
set neighborhood = coalesce(neighborhood, '')
where neighborhood is null;
