

# Purge Done Tasks and Ideas

## Overview
Add a "Purge Done" button to both the Tasks and Ideas pages that bulk-deletes all items with "done" status, with a confirmation dialog to prevent accidents.

---

## Tasks Page (`src/pages/Tasks.tsx`)

In the filter/toolbar row (around line 168), add a "Purge Done" button (destructive variant, with `Trash2` icon) that:
- Only appears when there are done tasks (`tasksByStatus.done.length > 0`)
- Opens an `AlertDialog` confirming: "This will permanently delete **X** completed tasks. This cannot be undone."
- On confirm, loops through all done tasks and calls `deleteTask(id)` for each, then shows a success toast

## Ideas Page (`src/pages/Ideas.tsx`)

In the filter/toolbar row (around line 113), add a matching "Purge Done" button that:
- Only appears when there are done ideas (`ideasByStatus.done.length > 0`)
- Opens an `AlertDialog` confirming: "This will permanently delete **X** completed ideas. This cannot be undone."
- On confirm, loops through all done ideas and calls `deleteIdea(id)` for each, then shows a success toast

---

## Technical Details

### Tasks Page Changes
- Import `Trash2` from lucide-react, `AlertDialog` components, and `toast`
- Add `deleteTask` to the destructured `useApp()` call
- Add state: `const [showPurgeDialog, setShowPurgeDialog] = useState(false)`
- Add handler that iterates `tasksByStatus.done` and calls `deleteTask(t.id)` for each
- Place button in the filter bar area, right-aligned (near the Reminders switch)

### Ideas Page Changes
- Import `Trash2` from lucide-react, `AlertDialog` components, and `toast`
- Add `deleteIdea` to the destructured `useApp()` call
- Add state: `const [showPurgeDialog, setShowPurgeDialog] = useState(false)`
- Add handler that iterates `ideasByStatus.done` and calls `deleteIdea(i.id)` for each
- Place button in the filter bar, right-aligned

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Tasks.tsx` | Add purge done button + confirmation dialog |
| `src/pages/Ideas.tsx` | Add purge done button + confirmation dialog |

No database or schema changes needed -- uses existing delete mutations.

