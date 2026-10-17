# RLS validation checklist

Do not mark database/security phase complete until these checks have been run against a disposable Supabase project with the migration applied.

Create at least two offices (Office A and Office B), an owner and two agents in Office A, and an owner and an agent in Office B. Use distinct authenticated sessions for each role.

## Expected access

- [ ] An Office A owner can read and update Office A details.
- [ ] An Office A owner cannot read or update Office B details.
- [ ] An Office A owner can list Office A members, but cannot promote an agent to owner through the membership client API.
- [ ] An Office A agent can see active colleagues' profiles in their office, but cannot see unrelated profiles.
- [ ] An Office A agent can read/update only properties assigned to that agent.
- [ ] An Office A agent cannot read/update Office A properties assigned to another agent.
- [ ] An Office A agent cannot read any Office B properties.
- [ ] An agent cannot insert a property with another agent's user ID as owner_agent_id.
- [ ] A user who is not a member cannot read any office, member, property or photo metadata.
- [ ] Photo metadata must reference a property in the same office.
- [ ] Anonymous requests cannot read protected tables.

## CRM / matching access checks (after migration 003)

- [ ] Office A owner can read/create/update Office A customers and assign them to active Office A agents.
- [ ] Office A agent can read/create/update only customers assigned to that agent.
- [ ] An agent cannot assign a customer to another agent through the client API.
- [ ] A customer may have multiple roles and multiple active requirements.
- [ ] A requirement cannot reference a customer from another office.
- [ ] A match cannot connect a property, customer and requirement from different offices.
- [ ] An agent can only read/update matches assigned to them.
- [ ] A notification is readable only by its recipient and cannot be forged by an ordinary client.
- [ ] Customer activities and appointments cannot reference records from another office.
- [ ] Office A users cannot access Office B customers, requirements, matches, activities, appointments or notifications.
- [ ] Anonymous requests cannot read protected CRM tables.

## Known limitations before production

- Migrations 001–003 are drafts until applied to a disposable Supabase project and verified.
- The schema creates the CRM/matching data model, but does not implement the matching evaluator, notification creation, reminder scheduling or the corresponding mobile screens.
- Photo upload uses the private bucket/policies in migration 002, but still requires end-to-end validation.
- Invitation acceptance, account deletion and the full KVKK retention/deletion flow are not implemented yet.
