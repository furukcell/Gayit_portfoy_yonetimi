# Firebase setup (migration in progress)

Project: `gayit-portfoy-yonetimi`; Firestore location: `europe-west1`.

## Important status

The existing mobile app still contains Supabase-specific data queries and Edge Function calls. Adding Firebase configuration alone does **not** switch the app backend. Finish the service-by-service migration and run CI before distributing a Firebase-connected APK.

## Register the app

1. Firebase Console > Project settings > Your apps > Add app > Web app. The web app registration is used to obtain the Firebase client configuration for the Expo app.
2. Add these values as local `.env` entries and GitHub Actions repository secrets/variables for builds:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
3. Enable Authentication > Sign-in method > Email/Password.
4. Publish `firestore.rules` and `storage.rules` only after checking the matching data model. Never use open/test rules in production.

Firebase web configuration values are client configuration, not Admin SDK credentials. Never put service-account JSON or Admin SDK private keys in the app, repository, or EXPO_PUBLIC variables.

## Superadmin bootstrap

The app must not let users select or self-assign a superadmin role. Create the first administrator user in Firebase Authentication, then create `superadmins/{AUTH_UID}` from Firebase Console/ trusted Admin SDK workflow. Keep client writes to `superadmins` denied. Only then provision office records and owner memberships through a trusted workflow.

## Data model expectations for the initial rules

- `profiles/{uid}`: `full_name`, `username`, `avatar_path`, `account_status`, `must_change_password`
- `office_members/{uid}`: `office_id`, `role` (`owner` or `agent`), `status`
- `offices/{officeId}`: office details
- office-scoped collections such as `properties`, `customers`, `customer_requirements`, `property_photos`, `property_favorites`, `property_transactions`, `appointments`, `notifications`, and `matches` use `office_id`.

These rules are a migration starting point and must be tested against every query before release. Firestore rules are not filters; queries must be scoped so every returned document is authorized.
