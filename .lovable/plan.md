

# "This instance or all?" prompt for recurring maintenance edits

## How it works

When editing a recurring maintenance task and the user changes the **next due date**, clicking Save shows an AlertDialog asking:

- **"Just this one"** — Updates only the next due date, leaves the recurrence rule unchanged
- **"All future tasks"** — Updates both the due date AND recalculates the series (updates the recurrence rule if frequency also changed)

If the task has no recurrence (frequency is "none"), or the due date wasn't changed, no prompt appears — it saves directly as today.

## Changes

### `src/pages/Maintenance.tsx`

**New state**: Add `seriesChoice` state (`null | 'pending'`) to track whether the series prompt is showing.

**Edit dialog save flow**:
1. In `handleSave`, before executing the mutation, check if:
   - The task has a recurrence (frequencyKey !== 'none')
   - AND the due date was changed from the original
2. If both true, set `seriesChoice = 'pending'` to show the AlertDialog instead of saving immediately
3. Add `handleSeriesConfirm(choice: 'single' | 'all')`:
   - **'single'**: Call the mutation with the new due date but preserve the original frequency/recurrence rule unchanged. For ai_enrichments, only update `recommended_due_date`. For tasks-table items, only update `next_due_date`.
   - **'all'**: Call the mutation with all changes (due date + frequency + name + provider), same as current behavior.
4. Close the series dialog and edit dialog on success.

**New AlertDialog** (after the edit Dialog):
- Title: "Update recurring task"
- Description: "Do you want to change just this occurrence, or all future occurrences?"
- Two action buttons: "Just this one" and "All future tasks"
- Cancel button to go back to editing

### Files
| File | Change |
|------|--------|
| `src/pages/Maintenance.tsx` | Add series choice AlertDialog in save flow |

