# Firebase setup

Project: `gayit-portfoy-yonetimi`; Firestore location: `europe-west1`.

## Important status

The mobile app now uses Firebase Auth, Firestore, Storage, and callable Firebase Functions through a compatibility layer. CI checks are running; do not distribute a release APK until the current checks pass and the Firebase project is configured.

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
4. Enable Firebase Storage if media upload is needed.
5. Deploy the Firestore/Storage rules and callable Functions from a trusted local Firebase CLI session: `firebase deploy --only firestore:rules,storage,functions`. Review the rules against your real project before publishing; never use open/test rules in production.

Firebase web configuration values are client configuration, not Admin SDK credentials. Never put service-account JSON or Admin SDK private keys in the app, repository, or EXPO_PUBLIC variables.

## Superadmin bootstrap

The app must not let users select or self-assign a superadmin role. Create the first administrator user in Firebase Authentication, then create `superadmins/{AUTH_UID}` from Firebase Console/ trusted Admin SDK workflow. Keep client writes to `superadmins` denied. Then deploy Functions with `firebase deploy --only functions`. The superadmin panel calls the server-side `createOffice` function; the mobile team panel calls `createAgent`; matching calls `evaluateMatches`. These operations require the first superadmin document to exist.

## Data model expectations for the initial rules

- `profiles/{uid}`: `full_name`, `username`, `avatar_path`, `account_status`, `must_change_password`
- `office_members/{uid}`: `office_id`, `role` (`owner` or `agent`), `status`
- `offices/{officeId}`: office details
- office-scoped collections such as `properties`, `customers`, `customer_requirements`, `property_photos`, `property_favorites`, `property_transactions`, `appointments`, `notifications`, and `matches` use `office_id`.

These rules are a migration starting point and must be tested against every query before release. Firestore rules are not filters; queries must be scoped so every returned document is authorized.

## GitHub Actions

The Android APK workflow now expects these six GitHub Actions repository secrets: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `EXPO_PUBLIC_FIREBASE_APP_ID`. Add the values from Firebase Console > Project settings > Your apps. The build intentionally fails early if they are missing, rather than creating an APK that crashes at startup.

## Important limitations before release

- Run the CI checks and verify a fresh Android APK from the current branch.
- Deploy callable Functions before using office creation, agent creation, or matching.
- Validate all Firestore queries and rules against the real project and test cross-office access denial.
- Existing Supabase data is not automatically imported into Firestore; a data migration is a separate task.
