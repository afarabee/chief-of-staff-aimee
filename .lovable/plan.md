

# Plan: Show Maintenance Tasks on Provider Detail

## Overview
Add a "Maintenance Tasks" section to the Provider detail view, displaying all tasks linked to that provider regardless of status.

## Changes

### 1. `src/hooks/useMaintenanceTasks.ts`
Add a new hook `useProviderMaintenanceTasks(providerId)`:
- Query key: `['tasks', 'provider', providerId]`
- Fetches from `tasks` table with `.eq('provider_id', providerId)`, using the same SELECT join and `mapRow` helper
- Enabled only when `providerId` is defined
- Add this query key to the `invalidateAll` function so task mutations refresh the provider view

### 2. `src/pages/Providers.tsx`
In the detail view section (after the notes block, around line 162), add:
- Import `useProviderMaintenanceTasks` and `useCompleteMaintenanceTask` hooks
- Import `MaintenanceTaskCard` component and `MaintenanceTaskForm` (Sheet)
- A "Maintenance Tasks" heading with a count badge
- List all tasks returned by the hook, rendered as `MaintenanceTaskCard` components
  - Pending/overdue/needs_attention tasks show the complete button
  - Completed tasks show with strikethrough styling
- Each card is clickable to open the task in the edit form (MaintenanceTaskForm Sheet)
- If no tasks, show muted text: "No maintenance tasks for this provider"
- An "Add Task" button below the list that opens MaintenanceTaskForm (no locked asset, but could pre-select the provider if the form supports it)

### 3. `src/components/maintenance/MaintenanceTaskForm.tsx`
Add an optional `lockedProviderId` prop (same pattern as `lockedAssetId`):
- When set, pre-fills the provider select and disables it
- This allows adding a task directly from the provider detail with the provider pre-selected

## Technical Notes
- Reuses existing `MaintenanceTaskCard` component with its variant logic (overdue, attention, upcoming, completed)
- Task variant is determined the same way as on the Maintenance page: check status and compare `nextDueDate` to today
- Query invalidation ensures the list refreshes after completing, editing, or deleting a task

