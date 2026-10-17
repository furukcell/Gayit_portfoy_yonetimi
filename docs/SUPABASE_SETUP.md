# Supabase setup

GAYIT uses Supabase Auth + Postgres with Row Level Security (RLS). Database policies are the security boundary; hiding buttons in the app is not authorization.

## Configure

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/migrations/001_initial_schema.sql`.
3. Copy `.env.example` to `.env` and fill in the project URL and publishable/anon key.
4. Do not use the `service_role` key in the mobile app, EAS variables exposed to the client, or any committed file.
5. Configure Auth email settings and redirect URLs before testing sign-in.

## Initial schema

- `profiles`: public profile row linked to `auth.users`.
- `offices`: one office and its owner.
- `office_members`: office role and membership status.
- `properties`: listings owned by an office and assigned to an agent.
- `property_photos`: metadata for images stored in Supabase Storage.

Owner membership is created by a database trigger when an office is created. A new auth user receives a profile row. The policies let an office owner manage office data and let an agent read/update only properties assigned to their own profile.

## Before production

- Run SQL against a disposable Supabase project and validate every policy with at least two offices, two owners and multiple agents.
- Add invitation acceptance and account deletion flows.
- Create a private Storage bucket and Storage RLS policies before photo uploads.
- Add automated integration tests for cross-office isolation.
- Configure backups and data-retention/KVKK processes.
