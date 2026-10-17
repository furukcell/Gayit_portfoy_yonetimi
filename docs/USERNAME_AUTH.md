# Username-only authentication

GAYIT does not expose an email-registration form. The planned sign-in UI asks for username and password only.

## Current implementation step

The `create-agent` Supabase Edge Function has been added as the server-side account-creation boundary. It verifies the caller's authenticated session and checks that they are an active owner of the requested office before creating an agent. The service-role key is read only from Edge Function environment variables.

For compatibility with Supabase's built-in email/password Auth, the function currently derives an internal synthetic email of the form `<username>@accounts.gayit.invalid`. This address is not shown in the UI and is not intended for email delivery. Public self-registration must remain disabled in Supabase Auth settings. Usernames are normalized to lowercase.

## Important follow-up before production

1. Confirm the chosen synthetic-email strategy is accepted by the deployed Supabase Auth configuration; if not, use a dedicated custom auth gateway rather than collecting real email addresses.
2. Implement username/password sign-in by deriving the same internal identity in the trusted client auth module, without exposing any other account data.
3. Implement the first-login password-change screen and enforce it in navigation and server-side policy.
4. Add avatar upload to a private Storage bucket and validate the uploaded path belongs to the requesting office.
5. Implement a separately protected superadmin web console and a server-side office-provisioning function. Do not allow users to choose the superadmin role.
6. Add rate limits, audit logs, password reset/recovery policy and tests for duplicate usernames and cross-office access.
7. Run the migration and integration tests in a disposable Supabase project before enabling this function in production.

The function is a first implementation step, not a claim that the complete authentication flow is already ready for production.
