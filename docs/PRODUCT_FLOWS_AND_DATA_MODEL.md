# GAYIT mobile UX and CRM data model

Status: product/design specification. This document does not mean the screens or matching engine are implemented.

## Product principles

- One Expo React Native app for iOS and Android.
- Same app for office owners and agents; role and office membership determine visible data and permitted actions.
- Mobile-first navigation: Home, Portfolio, Customers, Matches, More. Keep frequent actions reachable; place team, reporting, appointments and settings in relevant sections.
- The home screen is a useful daily work dashboard, not a wall of every feature.
- The application is an office CRM/portfolio tool, not a public listing marketplace.
- No invented metrics: empty/loading/error states should be explicit, and all counts must come from real database records.

## Role and data visibility

### Office owner
- Sees the office's active and archived portfolio, customers, requirements, matches, appointments and team.
- Can create and assign customers/portfolio records to active office members.
- Can manage team membership and view office-wide operational summaries.
- Cannot access another office's data.

### Agent
- Sees properties assigned to them and customers assigned to them.
- Can add/edit their own properties, customers, customer requirements, activity timeline and appointments.
- Sees matches assigned to them.
- Cannot access another agent's assigned records or any other office's records.

These restrictions must be enforced by Supabase RLS and trusted server functions, not only by hiding UI controls.

## Navigation and screen flows

1. Authentication
   - Username + password.
   - Resolve active office membership and role after sign-in.
   - If a first-login password change is required, complete it before showing the main app.
   - Show a useful error and retry path if profile, office membership or data loading fails.

2. Home
   - Office owner: office-wide portfolio counts, customer/follow-up counts, today's appointments, unread/new matches, team summary.
   - Agent: their own portfolio counts, assigned customers, follow-ups, today's appointments and new matches.
   - Quick actions: Add property, Add customer, Schedule appointment.
   - Activity/alerts: recent matches and follow-up tasks.
   - All counts are real query results. Do not use demo seed values in authenticated production screens.

3. Portfolio
   - One list with search and filters; quick segmented filter All / For sale / For rent.
   - Additional filters: active/optioned/sold/rented/archived, property type, city/district, price range, rooms, area and responsible agent (owner only).
   - Property detail: photos, address/map, features, price/status, assigned agent, edit/archive/status actions, share to WhatsApp/PDF and suitable customers.
   - For agents, query scope is their assigned portfolio; owners can filter across the office.

4. Customers
   - List with search, role chips (buyer, seller, tenant, landlord, investor), assigned agent (owner), active/inactive and follow-up filters.
   - Customer detail: contact details, role(s), notes, requirements, suitable properties, timeline, appointments and next follow-up.
   - Add/edit customer should allow multiple roles and multiple active requirements per customer.
   - A customer can be both a buyer and seller, or have multiple independent searches. Do not force one role or one requirement per customer.

5. Matches
   - Two clear sections: Exact matches and Alternatives.
   - Exact matches satisfy all required filters.
   - Alternatives are not presented as exact; each one must explain which preference differs (for example, slightly above budget or nearby district).
   - Match detail includes customer, property, reasons, assigned agent, lifecycle status and actions to share/contact/log feedback.
   - Avoid duplicate notifications for an existing property + requirement pair. Re-evaluate or refresh the saved match when either side changes.

6. More
   - Owner: Team, Office reports, Appointments, Office settings.
   - Agent: My appointments, Follow-ups, Profile/settings.
   - Superadmin remains a separate web administration experience, not a normal bottom-tab screen.

## Proposed mobile bottom navigation

- Home
- Portfolio
- Customers
- Matches
- More

Use a compact bottom bar on mobile rather than a desktop-style persistent left sidebar. More can host less-frequent functions. Detail forms should be pushed as screens or shown as focused sheets, not packed into Home.

## Matching rules

Initial matching is deterministic; AI is not required for the MVP.

Hard filters for exact matches:
- Same office.
- Property is active and not archived/sold/rented.
- Requirement is active and matches listing intent (sale/rent).
- Property type matches unless the requirement says any.
- City/district match where specified.
- Price is within min/max where specified.
- Room count and area match where specified.

Alternatives:
- Must still respect critical safety/business constraints such as office and transaction intent.
- Can relax only explicitly flexible preferences (for example, nearby district or a configurable small budget margin).
- Always include human-readable reasons for each deviation.
- Never send customer messages automatically in the MVP. Notify the assigned agent, who chooses whether to share via WhatsApp.

Lifecycle:
- A new property triggers evaluation against active requirements.
- A new/updated requirement triggers evaluation against active properties.
- Persist one match per property + requirement, with status/history and match reasons.
- Notify the assigned agent once for a newly created match; do not re-alert on every screen visit.
- When a property or requirement is deactivated or the property becomes sold/rented, stop showing it as a current candidate but retain history where appropriate.

## Data model

Existing base tables:
- `offices`: tenant boundary.
- `profiles`: authenticated user profile.
- `office_members`: owner/agent membership and active state.
- `properties`, `property_photos`: office portfolio and images.

Added by migration `003_customer_crm_matching.sql`:
- `customers`: contact record, one or more roles, assigned agent, notes and follow-up timestamps.
- `customer_requirements`: one or more independent search/transaction requirements per customer.
- `matches`: persisted property + requirement pair, assigned agent, status, score and reason strings.
- `notifications`: per-user in-app notifications with read state.
- `customer_activities`: customer interaction timeline.
- `appointments`: customer/optional property meeting and viewing schedule.
- `properties.property_type` and `properties.bedrooms_label`: additional property classification fields.

Important implementation note: schema and RLS are migration drafts until applied to a disposable Supabase project and tested. The matching evaluator, notification creation, UI, and appointment reminders are not implemented by this migration alone.

## Security and privacy checklist

- Keep all records scoped by `office_id`; validate linked customer/property/requirement belongs to the same office.
- Owner reads office-wide CRM data; agent reads records assigned to them.
- Notifications are recipient-only. Trusted server functions create notifications; clients must not be able to forge them.
- Keep phone, email, notes and viewing history private to authorized office members.
- Test owner/agent/cross-office and anonymous access using separate authenticated sessions.
- Define retention/deletion policy and provide appropriate KVKK/privacy notices before production.

## MVP implementation order

1. Apply and validate migrations/RLS in a disposable Supabase project.
2. Add real customer list/create/detail and requirement form.
3. Add property type, area/price/room filters and edit/archive actions.
4. Implement deterministic match evaluator and idempotent persisted matches.
5. Add notification list/unread counts and exact/alternative match UI.
6. Add customer activity timeline and appointments.
7. Replace demo home stats with real, role-scoped queries.
8. Run Android/iOS flow tests and RLS isolation tests before release.
