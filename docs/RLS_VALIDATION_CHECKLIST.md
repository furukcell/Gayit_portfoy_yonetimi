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
- [ ] Malformed avatar storage paths return a denied/empty result without a UUID-cast error.
- [ ] Agents can read office avatars but cannot upload, overwrite or delete avatar objects.

## CRM / matching access checks (after migrations 003 and 005)

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

- Migrations 001–005 are drafts until applied to a disposable Supabase project and verified.
- The matching evaluator exists as a Supabase Edge Function draft, but must be deployed and tested against real data before production use.
- Private property-photo upload uses migration 004 and must pass the role-isolation and upload/delete checks below before production use.
- Invitation acceptance, account deletion and the full KVKK retention/deletion flow are not implemented yet.


## CRM, matching, notifications and appointments (migrations 003 and 005)

- [ ] Owner sees customers, requirements, matches, activities and appointments only for the active office.
- [ ] Agent sees only assigned customers and matches; cannot read another agent's customer notes or activity history.
- [ ] Attempt to create a customer requirement for a customer in another office must fail.
- [ ] Attempt to create a match whose property, customer or requirement belongs to another office must fail.
- [ ] Attempt to call evaluate-matches with a non-member officeId must return 403.
- [ ] Disabled profile cannot call create-agent even if its JWT has not expired.
- [ ] Disabled or missing profile cannot call create-office with a stale superadmin JWT.
- [ ] Inactive office cannot create agent accounts.
- [ ] Non-owner and inactive office members cannot create agent accounts.
- [ ] Disabled profile cannot call evaluate-matches even if its JWT has not expired.
- [ ] Inactive office cannot run evaluate-matches.
- [ ] Agent can evaluate matches only for an office where their membership is active.
- [ ] Match evaluation only uses active properties and active requirements and does not create duplicate requirement/property pairs.
- [ ] Existing match re-evaluation updates score/reasons but does not send another new-match notification.
- [ ] New match notification is delivered only to the customer's assigned agent.
- [ ] User can mark only their own notifications as read.
- [ ] Authenticated clients cannot edit notification title, body, recipient, or linked record IDs; only `read_at` is writable.
- [ ] An agent who created an activity cannot edit it after the customer is reassigned to another agent.
- [ ] Appointment assigned_agent_id must be an active member with an active profile in the same active office.
- [ ] Customer assignment rejects disabled profiles and inactive offices.
- [ ] Customer created_by cannot be changed after insertion.
- [ ] Customer activities and appointments cannot reference a customer/property from another office.
- [ ] Follow-up date is optional; malformed client input is rejected before save.


## Property photo storage (after migration 004)

- [ ] Office owner can upload and view photos for listings in their office.
- [ ] Agent can upload/view photos only for listings assigned to them.
- [ ] Agent cannot read, upload, or delete storage objects for another agent's listing.
- [ ] Office A users cannot access Office B photo objects, even if they know the object path.
- [ ] Upload rejects unsupported MIME types and files larger than 10 MB.
- [ ] PDF presentation includes signed photo URLs only for the selected listing.
- [ ] Removing a photo removes its metadata and storage object; failed storage deletion is surfaced for cleanup.

## Edge Function record scope

- [ ] Agent calling evaluate-matches with their office ID only evaluates customers assigned to them and listings owned by them.
- [ ] Agent-supplied IDs for another agent's customer or listing return not found and create no matches/notifications.
- [ ] Owner can evaluate matches across the active office only.
