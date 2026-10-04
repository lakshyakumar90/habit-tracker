# Habitly

Habitly is a local-first Expo habit tracker with a lilac and cream design system. It includes a guest onboarding flow, daily habit tracking, habit schedules and history, task planning, progress summaries, search, appearance settings, and JSON export.

## Run it

Use Node.js 22.13 or newer with pnpm:

```sh
pnpm install
pnpm start
```

Open the project in an Android development build or Expo Go. The app uses Expo SDK 57 and `expo-sqlite`; local records persist between launches. The first launch includes sample habits and tasks so the screens are ready to explore.

## Checks

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm exec expo install --check
pnpm exec expo export --platform android
```

## Project guides

- [features.md](features.md) describes the product scope and behaviors.
- [implementation.md](implementation.md) describes the architecture, local database policy, design rules, and verification plan.

## Current integration boundary

The app works in guest/offline mode. Supabase cloud accounts and synchronization, Google/email sign-in, account deletion, and scheduled notifications are not wired up: this checkout has no backend URL/key, OAuth client IDs, or notification setup. Those features require credentials and additional integration work; settings describe the current local-only behavior rather than pretending it is synced.
