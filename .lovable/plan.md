

# Fix: Show Google Calendar Option on All Tasks

## Problem
The "Add to Google Calendar" section is conditionally rendered only when `dueDate` is set. Most tasks don't have a due date, so the calendar option is hidden.

## Solution
Always show the "Add to Google Calendar" toggle in the TaskForm. When the user enables it without a due date set, auto-require them to pick a date (or show a hint). The simplest approach: always render the calendar section, but disable the toggle with a hint if no due date is selected.

## Change

### `src/components/tasks/TaskForm.tsx`
- Remove the `{dueDate && (...)}` conditional wrapper around the calendar section (line 252)
- Always show the section, but when no due date is set:
  - Show the toggle as disabled with helper text like "Set a due date to enable"
- When toggling on without a due date, it stays disabled with the message
- When a due date is cleared while `addToCalendar` is true, auto-turn off the toggle

| File | Change |
|------|--------|
| `src/components/tasks/TaskForm.tsx` | Always show calendar section; disable toggle when no due date |

