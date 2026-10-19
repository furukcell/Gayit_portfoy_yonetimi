-- Building age and floor information for property listings.
-- Apply in the Supabase SQL Editor before using these fields.
alter table public.properties
  add column if not exists building_age integer,
  add column if not exists floor_number integer,
  add column if not exists total_floors integer;
