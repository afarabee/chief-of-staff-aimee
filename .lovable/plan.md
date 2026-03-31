

# Add Timed Events + Reminders to Google Calendar (Tasks & Maintenance)

## Overview
Upgraded calendar event creation to support specific times and reminders for both COS tasks and maintenance tasks.

## What changed

### Edge Function (`create-calendar-event`)
- Accepts optional `start_time` (HH:mm), `time_zone`, and `reminders` (array of minutes)
- When `start_time` provided: creates timed 1-hour event using `dateTime` instead of all-day `date`
- When `reminders` provided: sets custom popup reminders on the event
- Backward compatible — omitting these fields keeps all-day behavior

### COS Tasks (`TaskForm.tsx`)
- "Add to Google Calendar" toggle appears when a due date is set
- Time picker (defaults to 09:00) and reminder dropdown (6 presets matching Google Calendar)
- On submit, creates calendar event after saving the task

### Maintenance Tasks (`Maintenance.tsx`)
- Schedule-to-calendar flow now includes time picker and reminder dropdown
- Passes `start_time`, `time_zone`, `reminders` to the edge function

### Asset Suggestions (`AssetSuggestionsSection.tsx`)
- Same time/reminder inputs added to the scheduling confirmation UI

### Hooks
- New `useTaskToCalendar.ts` hook for COS task → calendar
- Updated `useScheduleToCalendar.ts` to accept optional `startTime`, `timeZone`, `reminders`

## Reminder options
| Label | Minutes |
|-------|---------|
| At time of event | 0 |
| 5 minutes before | 5 |
| 15 minutes before | 15 |
| 30 minutes before | 30 |
| 1 hour before | 60 |
| 1 day before | 1440 |
