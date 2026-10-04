# Habitly features

Habitly is a local-first habit and task tracker inspired by the supplied design roadmap. This file describes the v1 product boundary and the behavior users can expect.

## V1 scope

- First-run welcome and a short setup flow; continue with a local guest profile.
- Today dashboard with date, completion progress, active streak, scheduled habits, and today's tasks.
- Habit list with All, Active, and Archived filters; create, edit, archive, restore, and delete habits.
- Habit types: check-off, quantity, duration, and counter. Schedules support every day and chosen weekdays.
- Habit detail with current/longest streaks, completion rate, schedule, and a month-labelled contribution calendar. Tapping a date opens a month calendar and lets the user add or remove historical check-ins.
- Optional repeating local habit reminders on the selected weekdays at any chosen hour and minute.
- Tasks with arbitrary due dates, notes, priority, completion, Today, Upcoming, and Completed views, plus optional local reminders at any chosen hour and minute.
- Statistics for scheduled check-in consistency through the current day, average weekly consistency in the current month, total completed check-ins, streaks, and best weekday.
- Local search across habits and tasks.
- Settings for profile name, working light/dark/system appearance, selectable accent color, an in-app local-data explanation, notification permission, and JSON file/share or clipboard export.
- Offline persistence on device using SQLite; seeded sample habits for a first-run preview.

## Deferred scope

Google/email authentication, account recovery/deletion, Supabase-backed accounts, cross-device synchronization, sync conflict resolution, push notifications, background sync, and production release infrastructure require provider configuration and/or device credentials. Task and habit reminders are local scheduled notifications and require notification permission on a supported native build. Notification appearance is controlled by the operating system.

AI coaching, social features, leaderboards, health integrations, widgets, subscriptions, teams, and a web dashboard are out of v1 scope.

## Core interaction rules

- Habit and task changes persist locally before the screen reports completion.
- A habit has at most one entry per local calendar date; repeat taps toggle that date's check-off state.
- Quantity, duration, and counter habits complete when their entry meets the configured target.
- Habit check-ins can be added or changed for recent dates on Today and for any date through the habit detail calendar.
- Archived habits stay in history and can be restored. Explicit delete removes the habit and its entries.
- Statistics and heatmap intensity derive from local entries, not presentation state.
- Dates are stored as `YYYY-MM-DD` local calendar keys to avoid UTC date shifts.
