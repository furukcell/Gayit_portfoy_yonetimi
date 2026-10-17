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

## Known limitation before production

The initial migration stores photo metadata only; it does not create a Storage bucket or Storage policies. Photo upload must not be enabled until a private bucket and corresponding policies are configured. Invitation acceptance and account deletion are also not implemented yet.
