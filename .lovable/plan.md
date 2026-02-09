

# Fix Calendar Picker Position Jumping in Task Form

## Problem
When opening the date picker in the Task form, the calendar popup starts below the field but jumps above it when navigating months. This happens because the Radix Popover detects a collision with the viewport edge and flips the popover to the other side. The other forms (Maintenance, Assets) don't exhibit this because they have different scroll/layout contexts.

## Solution
Pin the popover to always open below the trigger by setting `side="bottom"` and `avoidCollisions={false}` on the `PopoverContent` in the Task form. Also add the missing `pointer-events-auto` class to the Calendar.

## File Change

**`src/components/tasks/TaskForm.tsx`** (line ~144)

Change:
```tsx
<PopoverContent className="w-auto p-0" align="start">
  <Calendar
    mode="single"
    selected={dueDate}
    onSelect={setDueDate}
    initialFocus
  />
</PopoverContent>
```

To:
```tsx
<PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
  <Calendar
    mode="single"
    selected={dueDate}
    onSelect={setDueDate}
    initialFocus
    className="p-3 pointer-events-auto"
  />
</PopoverContent>
```

This prevents the popover from recalculating its position when the calendar content changes during month navigation.

