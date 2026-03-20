

# Fix: Move Clear Date button for better visibility

The "Clear date" button is currently placed **below** the calendar inside the popover, which can get clipped or hidden depending on viewport size. The fix is to place a small "Clear" link next to the "Due Date" label, making it always accessible.

## Changes

### 1. `src/components/tasks/TaskForm.tsx`
- Replace the label `<Label>Due Date</Label>` with a flex row containing the label and a conditional "Clear" button
- Remove the "Clear date" section from inside the `PopoverContent`

### 2. `src/components/assets/AssetForm.tsx`
- Apply the same pattern: move "Clear date" next to the "Purchase Date" label and remove it from inside the popover

