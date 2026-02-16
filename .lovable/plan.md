

# Pre-Generate Recurring Reminder Occurrences

## Overview
When a recurring reminder is created (or edited to add a recurrence rule), automatically generate all future occurrences to fill one year. If the recurrence interval exceeds one year, generate exactly two reminders: the initial one and the next occurrence.

## Current Behavior
- Only one reminder is created at a time
- The next occurrence is generated only when a reminder is marked as completed

## New Behavior
- On **create**: if a recurrence rule and a next_due_date are set, calculate all future dates within one year from the initial date and bulk-insert them alongside the original
- On **edit**: if the recurrence rule or due date changes, remove previously auto-generated future occurrences and regenerate them
- On **complete**: when completing a recurring task that already has future occurrences pre-generated, do NOT create a duplicate next occurrence (the existing logic for spawning the next one should be skipped since it already exists)

## Example
- Reminder: "Change HVAC filter", due 2026-03-01, recurrence: every 3 months
- Generated reminders: Mar 1, Jun 1, Sep 1, Dec 1 (4 occurrences within a year)
- Reminder: "Annual furnace inspection", due 2026-03-01, recurrence: every 2 years
- Generated reminders: Mar 1 2026, Mar 1 2028 (2 occurrences since interval > 1 year)

## Technical Details

### File: `src/hooks/useMaintenanceTasks.ts`

**New helper function** `generateOccurrences(startDate, rule, maxCount=52)`:
- Parse the recurrence rule (e.g. `3m`, `7d`, `1y`)
- Calculate the interval in days to determine if it exceeds one year
- If interval > 365 days: return just the next occurrence date (1 item)
- Otherwise: keep adding intervals until the date exceeds startDate + 1 year
- Return array of date strings

**Modify `useCreateMaintenanceTask`**:
- After inserting the primary task, if `recurrence_rule` and `next_due_date` are present, call `generateOccurrences` and bulk-insert all future occurrences with the same name, asset_id, provider_id, notes, recurrence_rule, and status `pending`

**Modify `useUpdateMaintenanceTask`**:
- When `recurrence_rule` or `next_due_date` changes on a pending task, delete all other pending tasks with the same name, asset_id, and recurrence_rule that have a future due date, then regenerate occurrences from the updated date/rule
- This keeps edits clean without orphaned future tasks

**Modify `useCompleteMaintenanceTask`**:
- Remove the existing logic that creates the next occurrence on completion, since future occurrences are already pre-generated
- Keep the status update to `completed` and `date_completed` setting

### No database or schema changes required
All changes are in application logic only. The existing `tasks` table structure supports this as-is.

