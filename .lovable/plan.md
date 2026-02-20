

# Fix Mobile Modals: Complete Coverage

## Current State
The `ResponsiveFormDialog` component already exists and correctly renders a bottom Sheet on mobile and Dialog on desktop. It's used in most places -- but two components still use raw `Dialog` and will be broken on mobile.

## Changes Required

### 1. Convert `QuickAdd.tsx` to use `ResponsiveFormDialog`
**File:** `src/components/dashboard/QuickAdd.tsx`
- Replace the two raw `<Dialog>` + `<DialogContent>` wrappers with `<ResponsiveFormDialog>` for both the Task and Idea forms
- This ensures the Quick Add dialogs on the dashboard work on mobile

### 2. Convert `CreateTaskDialog.tsx` to use `ResponsiveFormDialog`
**File:** `src/components/calendar/CreateTaskDialog.tsx`
- Replace the raw `<Dialog>` + `<DialogContent>` with `<ResponsiveFormDialog>`
- This is a small picker dialog (choose "Kanban Task" or "Reminder"), so it benefits from responsive treatment on mobile

### 3. Add mobile keyboard scroll-into-view behavior
**File:** `src/components/ui/responsive-dialog.tsx`
- In the mobile (Sheet) branch, add an `onFocus` handler on the scrollable body `<div>` that calls `scrollIntoView({ behavior: 'smooth', block: 'center' })` on the focused input element
- This ensures that when the on-screen keyboard opens, the active field scrolls into view instead of being hidden

### 4. Fix duplicate close button in Sheet
**File:** `src/components/ui/responsive-dialog.tsx`
- The `SheetContent` component renders a default close X button (from the sheet primitive), and the `ResponsiveFormDialog` also renders a custom close Button in the header
- This results in two close buttons on mobile; remove the custom one since `SheetContent` already provides one, OR suppress the default one and keep the custom header button for better positioning

## No other changes needed
All other form modals (TaskForm, IdeaForm, MaintenanceTaskForm, AssetForm, ProviderForm, Categories) already use `ResponsiveFormDialog`. The `AlertDialog` usages (delete confirmations, convert confirmations) are small confirmation dialogs that work fine as centered modals on all screen sizes.

