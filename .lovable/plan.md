
# Add Inline "New Provider" from Maintenance Task Form

## Overview
Add a "+ New Provider" option inside the Maintenance Task form's provider dropdown area. When used, it shows an inline mini-form to create a provider without leaving the maintenance task form. After saving, the new provider is auto-selected and the user continues editing their maintenance task.

## Changes

### 1. `src/hooks/useProviders.ts` -- Return new provider ID
Change `useCreateProvider` to return the created record so the form can auto-select it:
- Change `.insert(provider)` to `.insert(provider).select('id').single()`
- Return `data` from the mutation function

### 2. `src/components/maintenance/MaintenanceTaskForm.tsx` -- Inline provider creation
Replace the provider Select block (lines 122-134) with:

- A `showNewProvider` boolean state
- When `false`: show the existing Select dropdown + a small "+ New Provider" button (ghost variant, Plus icon, below the select)
- When `true`: hide the select, show an inline mini-form with:
  - Name field (required)
  - Phone field (optional)
  - Email field (optional)
  - Save and Cancel buttons
- New local state for the mini-form fields: `newProviderName`, `newProviderPhone`, `newProviderEmail`
- On Save: call `useCreateProvider`, on success receive the new ID, call `setProviderId(newId)`, reset mini-form state, set `showNewProvider = false`
- On Cancel: reset mini-form state, set `showNewProvider = false`, return to the select

All other maintenance task form fields remain intact -- the user never leaves the form.
