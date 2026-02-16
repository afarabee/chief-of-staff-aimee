

# Update Future Occurrences When Editing a Recurring Reminder

## Overview
Currently, when a recurring reminder is edited, future occurrences are only deleted and regenerated if the recurrence rule or due date changes. Other field changes (name, asset, provider, notes, etc.) are not propagated to existing future occurrences. This change ensures that **all** editable fields are synced to future pending occurrences whenever a recurring reminder is updated.

## Current Behavior
- Editing a reminder's name, notes, asset, or provider only updates that single reminder
- Future pending occurrences retain the old values
- Only rule/date changes trigger delete-and-regenerate of future occurrences

## New Behavior
- When editing a recurring reminder, identify all future pending occurrences (same name, same recurrence_rule, same asset_id, status = pending, id != current)
- If the recurrence rule or due date changed: delete and regenerate (existing logic, already works)
- If other fields changed (name, asset_id, provider_id, notes) but rule/date did NOT change: bulk-update all future pending occurrences with the new values
- This covers scenarios like renaming a reminder, changing its linked asset/provider, or updating notes

## Technical Details

### File: `src/hooks/useMaintenanceTasks.ts` -- `useUpdateMaintenanceTask`

Add a new branch after the existing rule/date-change logic:

- If rule/date did NOT change, but the task has a recurrence_rule and there are field changes (name, asset_id, provider_id, notes):
  1. Build a query to find sibling pending occurrences using the **old** name, old asset_id, and old recurrence_rule (excluding the current task id)
  2. Build an update payload with the changed fields
  3. Bulk-update those rows via `.update()` with the matching filters

- The existing delete-and-regenerate path already handles the case where rule/date changes, and it already uses the new field values when regenerating -- so no changes needed there.

### Example
- "Change HVAC filter" has 4 future occurrences (Jun, Sep, Dec, Mar)
- User renames it to "Replace HVAC filter" and changes the linked provider
- All 4 future pending occurrences get updated with the new name and provider

