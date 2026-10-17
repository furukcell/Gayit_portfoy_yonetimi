-- GAYIT product features: persistent favorites and completed transaction records.
-- Apply with Supabase CLI or SQL Editor after the existing migrations.
create table if not exists public.property_favorites (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (office_id, property_id, user_id)
);
create index if not exists property_favorites_user_idx on public.property_favorites(office_id, user_id, created_at desc);
alter table public.property_favorites enable row level security;
create policy property_favorites_select_self on public.property_favorites
for select to authenticated using (user_id = (select auth.uid()) and public.is_active_office_member(office_id));
create policy property_favorites_insert_self on public.property_favorites
for insert to authenticated with check (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
  and exists (select 1 from public.properties p where p.id = property_favorites.property_id and p.office_id = property_favorites.office_id)
);
create policy property_favorites_delete_self on public.property_favorites
for delete to authenticated using (user_id = (select auth.uid()) and public.is_active_office_member(office_id));

create table if not exists public.property_transactions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  agent_id uuid not null references public.profiles(id) on delete restrict,
  transaction_type public.property_listing_type not null,
  final_price numeric(14,2) not null check (final_price > 0),
  office_commission numeric(14,2) not null default 0 check (office_commission >= 0),
  agent_commission numeric(14,2) not null default 0 check (agent_commission >= 0),
  closed_on date not null default current_date,
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint property_transactions_commission_check check (office_commission + agent_commission <= final_price)
);
create index if not exists property_transactions_office_date_idx on public.property_transactions(office_id, closed_on desc);
alter table public.property_transactions enable row level security;
create policy property_transactions_select_office on public.property_transactions
for select to authenticated using (
  public.is_active_office_member(office_id)
  and (public.is_office_owner(office_id) or agent_id = (select auth.uid()))
);
create policy property_transactions_insert_office on public.property_transactions
for insert to authenticated with check (
  public.is_active_office_member(office_id) and created_by = (select auth.uid())
  and (public.is_office_owner(office_id) or agent_id = (select auth.uid()))
  and (property_id is null or exists (select 1 from public.properties p where p.id = property_transactions.property_id and p.office_id = property_transactions.office_id))
);
create policy property_transactions_update_owner on public.property_transactions
for update to authenticated using (public.is_office_owner(office_id)) with check (public.is_office_owner(office_id));
create policy property_transactions_delete_owner on public.property_transactions
for delete to authenticated using (public.is_office_owner(office_id));

-- Keep a per-user recent-view list, scoped to the active office.
create table if not exists public.property_recent_views (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (office_id, property_id, user_id)
);
create index if not exists property_recent_views_user_idx
  on public.property_recent_views(office_id, user_id, viewed_at desc);
alter table public.property_recent_views enable row level security;
create policy property_recent_views_select_self on public.property_recent_views
for select to authenticated using (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
);
create policy property_recent_views_insert_self on public.property_recent_views
for insert to authenticated with check (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
  and exists (
    select 1 from public.properties p
    where p.id = property_recent_views.property_id
      and p.office_id = property_recent_views.office_id
  )
);
create policy property_recent_views_update_self on public.property_recent_views
for update to authenticated using (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
) with check (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
  and exists (
    select 1 from public.properties p
    where p.id = property_recent_views.property_id
      and p.office_id = property_recent_views.office_id
  )
);
create policy property_recent_views_delete_self on public.property_recent_views
for delete to authenticated using (
  user_id = (select auth.uid()) and public.is_active_office_member(office_id)
);

-- Optional office identity fields used by branded PDF presentations.
alter table public.offices
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists logo_url text;
