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

Theme colors are semantic tokens resolved from the selected light/dark/system palette and saved locally with the accent color. Screens and custom sheets share safe-area handling. The tab bar floats above the bottom inset, with scroll content padded clear of it.

## Persistence and migration policy

- Open one SQLite database lazily and create/upgrade its schema using `PRAGMA user_version`.
- Never drop the database as part of an app upgrade.
- Generate stable client-side IDs for records. Keep the local repository interface independent of Supabase.
- Export uses the same repository read API and creates portable JSON.
- Add a schema version and a forward migration whenever persisted structure changes.
- Task reminders use date triggers; habit reminders use weekly weekday triggers. Both use `expo-notifications` and a shared Android channel. Task reminder time/identifier and habit reminder time/identifiers are stored locally. Cancel and replace schedules when an item changes; cancel them when completed, archived, or deleted.
- Schema version 3 adds a habit reminder time and persisted notification identifier list. Migrations are forward-only.

## Navigation

The four primary tabs are Today, Habits, Tasks, and Stats. Habit details and Search are stack routes outside the tab bar. First launch uses a short welcome/setup experience and then enters the main app in guest mode.

## Visual system

Use a warm near-white/lilac canvas for light mode and a low-glare charcoal/plum canvas for dark mode, with deep ink/light text, selectable purple-led accents, and restrained yellow emphasis. Cards use rounded corners, thin borders, and generous spacing. Keep touch targets at least 44 points, provide accessible labels for icon-only controls, and respect the device color scheme where theme is set to System. Use Reanimated for focus transitions, card entrances, button presses, and tab selection. Use custom in-app sheets and calendar/time pickers instead of native alert dialogs.

## Verification

For a change, run the available TypeScript/lint checks and inspect Expo dependency health. Exercise first launch, persistence after restart, habit CRUD and completion, archive/restore, task completion, search, settings, and JSON export on a device/simulator when available. Native notifications, OAuth and cloud synchronization cannot be verified until credentials and a development build are configured.

## Feature-sized history

Implementation is committed in reviewable feature increments. Each commit should contain one coherent capability and its documentation/schema changes, rather than combining the entire product into a single commit.
