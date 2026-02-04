
# Plan: Add Priority-Based Background Colors to Task Cards

## Overview
Add pink background hue to High priority tasks and red background hue to Urgent priority tasks so they visually stand out from Medium and Low priority tasks on the Kanban board and elsewhere.

## Implementation

### File to Modify
**`src/components/tasks/TaskCard.tsx`**

### Changes

1. **Add a new priority background color map**
   Create a new constant that maps priority levels to card background colors:
   - `urgent`: Red hue (`bg-red-50 dark:bg-red-950/30`)
   - `high`: Pink hue (`bg-pink-50 dark:bg-pink-950/30`)
   - `medium`: Default card background (no extra class)
   - `low`: Default card background (no extra class)

2. **Apply the background color to the card**
   Update the card's `className` to include the priority-based background color, replacing the static `bg-card` when a priority background is defined.

### Code Changes

```tsx
// Add new constant after statusBorderColors (around line 50)
const priorityBackgrounds: Record<string, string> = {
  urgent: 'bg-red-50 dark:bg-red-950/30',
  high: 'bg-pink-50 dark:bg-pink-950/30',
  medium: '',
  low: '',
};

// Update the card div className (line 82-87)
<div
  className={cn(
    'group flex items-start gap-3 rounded-lg border border-l-4 p-4 shadow-sm hover:shadow-md transition-all',
    priorityBackgrounds[task.priority] || 'bg-card',
    !priorityBackgrounds[task.priority] && 'hover:bg-accent/50',
    priorityBackgrounds[task.priority] && 'hover:brightness-95',
    statusBorderColors[task.status],
    isComplete && 'opacity-60',
    onClick && 'cursor-pointer'
  )}
  onClick={onClick}
>
```

## Visual Result

| Priority | Background |
|----------|------------|
| Urgent | Subtle red background |
| High | Subtle pink background |
| Medium | Default card background |
| Low | Default card background |

Both colors will have dark mode variants to ensure good visibility in both themes.
