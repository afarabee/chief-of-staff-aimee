

# Plan: Sort Kanban Tasks by Due Date

## Overview
Update the task sorting in each Kanban column so tasks are ordered by due date, with overdue/earlier due dates at the top and tasks without a due date at the bottom.

## Sorting Logic
1. **Tasks with due dates** appear before tasks without due dates
2. **Among tasks with due dates**, sort by due date ascending (earliest/most overdue first)
   - Example order: Jan 1 (overdue) → Feb 1 (overdue) → Feb 10 (future)
3. **Tasks without due dates** appear at the bottom

## Implementation

### File to Modify
**`src/pages/Tasks.tsx`**

### Changes

Update the `tasksByStatus` memo (around lines 47-61) to add a sorting step after grouping:

```tsx
const tasksByStatus = useMemo(() => {
  const grouped: Record<TaskStatus, Task[]> = {
    backlog: [],
    'to-do': [],
    'in-progress': [],
    blocked: [],
    done: [],
  };
  
  filteredTasks.forEach((task) => {
    grouped[task.status].push(task);
  });
  
  // Sort each column: tasks with due dates first (ascending), then tasks without due dates
  Object.keys(grouped).forEach((status) => {
    grouped[status as TaskStatus].sort((a, b) => {
      // Tasks with due dates come before tasks without
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      // Both have due dates: sort ascending (earliest/overdue first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      // Neither has due date: maintain original order
      return 0;
    });
  });
  
  return grouped;
}, [filteredTasks]);
```

## Example Result
For a column with these tasks (today = Feb 4):
| Task | Due Date | Position |
|------|----------|----------|
| Fix bug | Jan 15 (overdue) | 1st |
| Review PR | Feb 1 (overdue) | 2nd |
| Plan sprint | Feb 10 (future) | 3rd |
| Research | No date | 4th |

## Summary
| File | Change |
|------|--------|
| `src/pages/Tasks.tsx` | Add due date sorting logic to `tasksByStatus` memo |

