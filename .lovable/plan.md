

# Maintenance Enhancements: Delete, Complete Fix, Sync Tooltip

## Changes

### 1. Tooltip on "Sync Calendar" buttons
**`src/pages/Maintenance.tsx`** and **`src/pages/Assets.tsx`**
- Wrap Sync Calendar button in `Tooltip`
- Text: *"Pulls status from Google Calendar. If an event was deleted there, the task returns to 'unscheduled' in this app. Nothing in Google Calendar is changed."*

### 2. Delete maintenance tasks
**`src/hooks/useMaintenanceTasks.ts`** — Add `useDeleteMaintenanceEvent` mutation:
- Sets suggestion status to `"dismissed"` in the `ai_enrichments` row
- Invalidates maintenance queries

**`src/pages/Maintenance.tsx`** — Add `Trash2` icon button with `AlertDialog` confirmation on each card

### 3. Fix complete button for one-time tasks
**`src/hooks/useAllMaintenanceEvents.ts`** — When `lastCompleted` exists and there's no frequency, set status to `'completed'` so the card moves to "Recently Completed"

### File summary
| File | Change |
|------|--------|
| `src/hooks/useMaintenanceTasks.ts` | Add `useDeleteMaintenanceEvent` |
| `src/hooks/useAllMaintenanceEvents.ts` | Fix non-recurring completion status |
| `src/pages/Maintenance.tsx` | Delete button + confirmation, sync tooltip |
| `src/pages/Assets.tsx` | Sync tooltip |

