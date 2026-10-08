# Habitly account deletion operations

## Data map

The app syncs `habits`, `entries`, `tasks`, and `preferences` under `users/{uid}/<collection>/{document}` in Firestore. The trusted deletion helper enumerates **every** direct subcollection under `users/{uid}` and recursively deletes it, including future collections. The root document becomes a data-free deletion marker. Firestore rules reject client writes while that marker exists, preventing an offline device with an old token from restoring deleted records. Firebase Authentication is deleted after Firestore data.

On the device, each signed-in user has `habitly-{uid}.db`. Account deletion clears its tables, including `sync_outbox`, then removes the database file where possible. The guest `habitly.db` is separate and is not the signed-in account's data.

## Free-plan server operation

Habitly stays on the Firebase Spark plan. The trusted endpoint is a Node.js route in the `portfolio-main` Next.js project at `https://lakshyakumar.in/api/habitly/delete-account`. It verifies the Firebase ID token (including revocation), checks that authentication occurred within five minutes, looks up the Auth user, deletes every Firestore subcollection under `users/{uid}`, then deletes the Firebase Auth user. The UID comes only from the verified token. It never accepts a UID from the app's request body.

In Firebase Console → Project settings → Service accounts, generate a **new private key** for project `habit-tracker-271da`. In Vercel's portfolio project settings, add the entire JSON as the server environment variable `HABITLY_FIREBASE_SERVICE_ACCOUNT_JSON` for Production (and Preview only if you deliberately test there). Never add it to an `EXPO_PUBLIC_` variable, `.env` file committed to Git, the mobile app, or chat. Set the portfolio's Node.js runtime to 22 or newer. Redeploy the portfolio after setting the variable.

Deploy the Firestore write guard from this repository before shipping the Android update:

```sh
firebase deploy --project habit-tracker-271da --only firestore:rules
```

This does not require Firebase Cloud Functions or a Blaze upgrade. The root deletion marker blocks old/offline clients from re-uploading data with a still-valid token. The marker contains no email, profile, or habit data.

## Web requests

The public page at `https://lakshyakumar.in/habitly/delete-account` posts to the portfolio's `/api/habitly/delete-request` endpoint. It sends an email using the portfolio's existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `CONTACT_TO` deployment variables. The form returns a request ID only after the email is accepted by SMTP. Monitor that mailbox. Do not delete an account solely from an unverified web form.

For a request: contact the **Habitly account email** obtained from Firebase Auth, confirm the requester controls it, record the request ID, and inspect the Firebase Auth UID. On a trusted computer, load the same service account JSON into `HABITLY_FIREBASE_SERVICE_ACCOUNT_JSON` as a local environment variable, then from `portfolio-main` run:

```sh
npx tsx scripts/delete-verified-habitly-account.ts user@example.com CONFIRMED_FIREBASE_UID REQUEST_UUID --verified
```

The script refuses an email/UID mismatch. It uses the same Firestore-first deletion helper as the API route. Confirm the Auth user is absent and the `users/{uid}` subcollections are empty; retain the request ID and completion record outside Habitly. The service account is **server-only** and must never be included in the Android app.

## Release checks

Use a test Firebase user and test the installed Android build: recent login, old login requiring Google reauthentication, cancelled Google prompt, offline deletion attempt, successful deletion, empty Firestore subcollections, absent Firebase Auth user, empty local SQLite/outbox, app return to onboarding, and a second device that was offline during deletion. Test the web form and mailbox delivery on the deployed portfolio before entering its URL in Play Console.
