# GAYIT Firebase Functions

Functions run in `europe-west1`. Install with `cd functions && npm install`, then deploy using a trusted Firebase CLI session: `firebase deploy --only functions`.

Create the first Firebase Authentication user manually, then create `superadmins/{uid}` in Firestore using the exact Auth UID. Never make the client able to write superadmin or membership documents. Office and agent provisioning is server-side through callable functions.
