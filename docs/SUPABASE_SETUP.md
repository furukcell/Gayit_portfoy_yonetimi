# Supabase setup

GAYIT is planned to use Supabase Auth + Postgres with Row Level Security (RLS). Database policies are the security boundary; hiding buttons in the app is not authorization.

## GAYIT account model (important)

- There is no public email-registration flow.
- A trusted superadmin creates an office and its owner account.
- The office owner creates agent accounts from the mobile app using username, an initial password and a profile photo.
- Usernames are unique; users sign in with username + password. The backend may map usernames to private Auth identities internally, but users do not need to enter an email address.
- Account creation must run through a trusted server-side Edge Function using the Supabase service-role key stored only as a server secret. Never call Auth admin APIs from the mobile client and never bundle the service-role key in the app.
- The server must validate that the requester is an active office owner before creating an agent, set the office membership and role itself, enforce username uniqueness, and return no other office data.
- Initial passwords must be delivered securely and changed on first sign-in. Add rate limiting and a safe password-reset/recovery process; username-only accounts have no email recovery unless another verified recovery channel is designed.
- Superadmin access must be a separate protected web console and server-side authorization role, not a selectable role in the mobile app.


## Edge Functions

Two initial server-side functions are included:

- `supabase/functions/create-office/index.ts`: checks the authenticated user's `app_metadata.role === superadmin` before provisioning an office owner and office.
- `supabase/functions/create-agent/index.ts`: checks the authenticated user is an active owner of the target office before creating an agent and membership.

Deploy these only after validating the schema in a disposable project. The initial superadmin must be provisioned out-of-band by a trusted administrator using Supabase Auth admin tooling; never let the public client assign its own superadmin role.

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

- Deploy and test the Edge Functions in a disposable Supabase project. Validate the synthetic `.invalid` email identity strategy against the project's Supabase Auth settings before use.
- Enforce disabled-account status in the sign-in/session flow; the current functions do not implement the full login gate.
- Run SQL against a disposable Supabase project and validate every policy with at least two offices, two owners and multiple agents.
- Add invitation acceptance and account deletion flows.
- Create a private Storage bucket and Storage RLS policies before photo uploads.
- Add automated integration tests for cross-office isolation.
- Configure backups and data-retention/KVKK processes.
