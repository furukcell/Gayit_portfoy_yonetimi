-- Extended property details for the listing form and branded PDF.
-- Apply this migration in the Supabase SQL Editor before using the new fields.
alter table public.properties
  add column if not exists bathrooms integer,
  add column if not exists balcony text,
  add column if not exists parking text,
  add column if not exists heating text,
  add column if not exists cooling text,
  add column if not exists occupancy_permit text,
  add column if not exists elevator text,
  add column if not exists nearby_amenities text;
