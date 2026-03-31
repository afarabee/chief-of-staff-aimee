

# Add Timed Events + Reminders to Google Calendar (Tasks & Maintenance)

## Overview
Upgrade calendar event creation to support specific times and reminders, for both COS tasks (TaskForm) and maintenance tasks (Maintenance page + AssetSuggestionsSection).

## Changes

### 1. `supabase/functions/create-calendar-event/index.ts`
- Accept optional `start_time` (HH:mm) and `reminders` (array of minutes, e.g. `[30]`) and `time_zone` (string)
- When `start_time` provided: use `dateTime` format with 1-hour duration instead of all-day `date` format
- When `reminders` provided: set `reminders: { useDefault: false, overrides: [{ method: 'popup', minutes }] }`
- When neither provided, keep current all-day behavior (backward compatible)

### 2. `src/hooks/useTaskToCalendar.ts` (new)
- Mutation hook calling `create-calendar-event` with summary, description, start_date, start_time, time_zone, reminders
- Returns `{ mutateAsync, isPending }`
- Shows toast with calendar link on success

### 3. `src/components/tasks/TaskForm.tsx`
- Add states: `addToCalendar`, `calendarTime` (default "09:00"), `calendarReminder` (default 30)
- When due date is set, show "Add to Google Calendar" toggle
- When toggled on, show time input + reminder dropdown
- Reminder options: At event (0), 5 min, 15 min, 30 min, 1 hour, 1 day
- On submit, after saving task, call calendar mutation if toggled on

### 4. `src/pages/Maintenance.tsx` — Schedule flow
- Add time + reminder fields to the schedule confirmation UI in `MaintenanceEventCard`
- Pass `start_time`, `time_zone`, `reminders` to `scheduleMutation.mutateAsync()`

### 5. `src/hooks/useScheduleToCalendar.ts`
- Accept optional `startTime`, `timeZone`, `reminders` in `ScheduleParams`
- Forward to edge function call

### 6. `src/components/assets/AssetSuggestionsSection.tsx`
- Add time + reminder inputs to the scheduling form for individual suggestions
- Pass new params through to `scheduleToCalendar.mutateAsync()`

### 7. `src/hooks/useBulkScheduleToCalendar.ts`
- No time/reminder for bulk (stays all-day) — bulk is a batch convenience

## Reminder options (matching Google Calendar)

| Label | Minutes |
|-------|---------|
| At time of event | 0 |
| 5 minutes before | 5 |
| 15 minutes before | 15 |
| 30 minutes before | 30 |
| 1 hour before | 60 |
| 1 day before | 1440 |

## Files

| File | Change |
|------|--------|
| `supabase/functions/create-calendar-event/index.ts` | Support `start_time`, `time_zone`, `reminders` |
| `src/hooks/useTaskToCalendar.ts` | New hook for task → calendar |
| `src/hooks/useScheduleToCalendar.ts` | Add optional time/reminder params |
| `src/components/tasks/TaskForm.tsx` | Calendar toggle + time/reminder UI |
| `src/pages/Maintenance.tsx` | Time/reminder in schedule flow |
| `src/components/assets/AssetSuggestionsSection.tsx` | Time/reminder in schedule flow |

