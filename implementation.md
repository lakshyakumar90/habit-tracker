# Habitly implementation guide

## Runtime

- Expo SDK 57, React Native 0.86, React 19, TypeScript, and Expo Router.
- Expo SDK API usage must follow the exact-version docs at https://docs.expo.dev/versions/v57.0.0/.
- SQLite is the source of truth for the current local-first release. No view or UI component talks directly to a remote database.

## Architecture

```text
src/app (routes and tab shell)
        ↓
src/features (screen composition and feature components)
        ↓
src/database/repositories (application-facing persistence API)
        ↓
expo-sqlite (versioned local schema)
```

Pure calculations live in `src/features/habits/domain` and `src/features/statistics`; reusable presentation primitives live in `src/components/ui`; semantic colors live in `src/theme`. SQLite queries are centralized in `src/database`.

Theme colors are semantic tokens resolved from the selected light/dark/system palette. Screens share safe-area handling; primary tab screens leave the bottom inset to the native tab bar.

## Persistence and migration policy

- Open one SQLite database lazily and create/upgrade its schema using `PRAGMA user_version`.
- Never drop the database as part of an app upgrade.
- Generate stable client-side IDs for records. Keep the local repository interface independent of Supabase.
- Export uses the same repository read API and creates portable JSON.
- Add a schema version and a forward migration whenever persisted structure changes.
- Task reminders use `expo-notifications`; scheduled identifiers and reminder times are stored in the versioned SQLite task schema. Cancel reminders when a task is completed, edited, or deleted.

## Navigation

The four primary tabs are Today, Habits, Tasks, and Stats. Habit details and Search are stack routes outside the tab bar. First launch uses a short welcome/setup experience and then enters the main app in guest mode.

## Visual system

Use a warm near-white/lilac canvas, deep ink text, purple as the primary accent, and restrained yellow for secondary emphasis. Cards use rounded corners, thin low-contrast borders, and generous spacing. Keep touch targets at least 44 points, provide accessible labels for icon-only controls, and respect the device color scheme where theme is set to System.

## Verification

For a change, run the available TypeScript/lint checks and inspect Expo dependency health. Exercise first launch, persistence after restart, habit CRUD and completion, archive/restore, task completion, search, settings, and JSON export on a device/simulator when available. Native notifications, OAuth and cloud synchronization cannot be verified until credentials and a development build are configured.

## Feature-sized history

Implementation is committed in reviewable feature increments. Each commit should contain one coherent capability and its documentation/schema changes, rather than combining the entire product into a single commit.
