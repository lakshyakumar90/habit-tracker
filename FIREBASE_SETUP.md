# Firebase setup for Habitly (Android and web)

The Firebase web values are in the ignored `.env.local`, and the supplied Android file is in the ignored root `google-services.json`. The Android package and Firebase project identifiers were checked against this app. iOS is not configured.

## Finish in Firebase Console

1. In **Authentication → Sign-in method**, enable **Google** and set the support email.
2. In **Firestore Database**, create the database in production mode if it does not exist. Publish this repository's [`firestore.rules`](./firestore.rules). With Firebase CLI, select project `habit-tracker-271da` and run `firebase deploy --only firestore:rules` from this directory. The rules restrict each account to its own `users/{uid}` data.
3. In **Project settings → Your apps → Android app**, confirm package `com.lakshya.kumar.habittracker`. Add both SHA-1 and SHA-256 for the key signing each development, preview, and production Android build. Add Google Play App Signing fingerprints when publishing through Play. Download a fresh `google-services.json` after registering fingerprints and replace the root file. The supplied file currently contains a web OAuth client but no Android OAuth client entry, so Google sign-in may fail until this is done.
4. For web sign-in, add each deployed web domain to **Authentication → Settings → Authorized domains**. Serve the SQLite WASM asset with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` headers as described in the [Expo SDK 57 SQLite web setup](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/). Expo labels SQLite web support alpha; verify browser storage and sign-in on the actual host before releasing web.

## Build configuration

Local builds use `.env.local` and `google-services.json`. Do not commit those files. The web Firebase configuration is public client configuration, but the file is kept local to avoid accidentally changing environments in source control. Analytics is not initialized because this app does not use analytics.

The **preview** EAS environment now has the seven `EXPO_PUBLIC_` values from [`.env.example`](./.env.example) and `GOOGLE_SERVICES_JSON` as a sensitive file variable. For later **development** and **production** builds, create the same eight variables in those EAS environments before building. [`app.config.js`](./app.config.js) uses the file path on the build worker and rejects an EAS build with missing Firebase values. [`eas.json`](./eas.json) selects the corresponding environment for each profile.

Restart Metro after changing `.env.local` and create a new Android development or production build. Google sign-in uses a native module and cannot run in Expo Go or a build made before this configuration.

## Release verification

1. Sign in with Google on Android device A. Create a task and complete a habit. Confirm **Settings → Backup & sync** reports `synced`.
2. Sign in with the same Google account on device B. Confirm habits, check-ins, tasks, and appearance settings restore.
3. Disconnect A, edit data, reconnect, and confirm the change reaches B.
4. Sign out and use a different Google account. Confirm the first account's data stays separate.
5. Check reminder scheduling and notification permission on each device. Notification identifiers remain device local.

Firebase Authentication stores the Google-linked identity. Firestore stores habits, check-ins, tasks, and preferences under `users/{uid}`. SQLite applies edits immediately and keeps a durable upload queue for offline changes. Firestore listeners bring changes from another device into SQLite. Same-record conflicts use the order in which Firestore accepts writes; independent records merge.
