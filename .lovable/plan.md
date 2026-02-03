
# Plan: Convert Ideas to Tasks and Vice Versa

## Overview
Add the ability to convert an idea to a task and a task to an idea. This will be implemented as a button in each form that creates a new item of the other type with the same data, then deletes the original item.

## Implementation Steps

### 1. Add Conversion Function to AppContext
**File:** `src/contexts/AppContext.tsx`

Add two new functions to the context:
- `convertIdeaToTask(ideaId: string)`: Creates a new task from idea data, then deletes the idea
- `convertTaskToIdea(taskId: string)`: Creates a new idea from task data, then deletes the task

The conversion logic:
- **Idea to Task**: Copy title, description, categoryId. Set status to 'to-do', priority to 'medium', dueDate to null
- **Task to Idea**: Copy title, description, categoryId. Map task status to idea status (done -> done, in-progress -> in-progress, others -> new)

### 2. Update TaskForm Component
**File:** `src/components/tasks/TaskForm.tsx`

When editing an existing task (not creating new), add a "Convert to Idea" button:
- Place it in the footer area, before the Cancel button
- Style as a secondary/outline button with an icon
- On click: call `convertTaskToIdea(task.id)`, then close the form

### 3. Update IdeaForm Component  
**File:** `src/components/ideas/IdeaForm.tsx`

When editing an existing idea (not creating new), add a "Convert to Task" button:
- Place it in the footer area, before the Cancel button
- Style as a secondary/outline button with an icon
- On click: call `convertIdeaToTask(idea.id)`, then close the form

## Detailed Implementation

### AppContext Changes

```typescript
interface AppContextType {
  // ... existing properties
  convertIdeaToTask: (ideaId: string) => void;
  convertTaskToIdea: (taskId: string) => void;
}

// Inside AppProvider:
const convertIdeaToTask = (ideaId: string) => {
  const idea = ideas.find((i) => i.id === ideaId);
  if (!idea) return;
  
  // Map idea status to task status
  const statusMap: Record<IdeaStatus, TaskStatus> = {
    'new': 'to-do',
    'in-progress': 'in-progress',
    'parked': 'backlog',
    'done': 'done',
  };
  
  // Create the task
  createTaskMutation.mutate({
    title: idea.title,
    description: idea.description,
    categoryId: idea.categoryId,
    status: statusMap[idea.status],
    priority: 'medium',
    dueDate: null,
  });
  
  // Delete the idea
  deleteIdeaMutation.mutate(ideaId);
};

const convertTaskToIdea = (taskId: string) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  
  // Map task status to idea status
  const statusMap: Record<TaskStatus, IdeaStatus> = {
    'backlog': 'parked',
    'to-do': 'new',
    'in-progress': 'in-progress',
    'blocked': 'parked',
    'done': 'done',
  };
  
  // Create the idea
  createIdeaMutation.mutate({
    title: task.title,
    description: task.description,
    categoryId: task.categoryId,
    status: statusMap[task.status],
  });
  
  // Delete the task
  deleteTaskMutation.mutate(taskId);
};
```

### Form Button UI

**TaskForm (Convert to Idea)**:
```tsx
import { Lightbulb } from 'lucide-react';

// In footer:
<div className="flex justify-between pt-4">
  {task && (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        convertTaskToIdea(task.id);
        onClose();
      }}
      className="gap-2"
    >
      <Lightbulb className="h-4 w-4" />
      Convert to Idea
    </Button>
  )}
  <div className="flex gap-2 ml-auto">
    <Button type="button" variant="outline" onClick={onClose}>
      Cancel
    </Button>
    <Button type="submit" disabled={!title.trim()}>
      {task ? 'Update' : 'Create'} Task
    </Button>
  </div>
</div>
```

**IdeaForm (Convert to Task)**:
```tsx
import { CheckSquare } from 'lucide-react';

// In footer:
<div className="flex justify-between pt-4">
  {idea && (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        convertIdeaToTask(idea.id);
        onClose();
      }}
      className="gap-2"
    >
      <CheckSquare className="h-4 w-4" />
      Convert to Task
    </Button>
  )}
  <div className="flex gap-2 ml-auto">
    <Button type="button" variant="outline" onClick={onClose}>
      Cancel
    </Button>
    <Button type="submit" disabled={!title.trim()}>
      {idea ? 'Update' : 'Create'} Idea
    </Button>
  </div>
</div>
```

## Status Mapping Logic

| Idea Status | Task Status (when converting) |
|-------------|-------------------------------|
| New         | To-Do                         |
| In-Progress | In-Progress                   |
| Parked      | Backlog                       |
| Done        | Done                          |

| Task Status | Idea Status (when converting) |
|-------------|-------------------------------|
| Backlog     | Parked                        |
| To-Do       | New                           |
| In-Progress | In-Progress                   |
| Blocked     | Parked                        |
| Done        | Done                          |

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AppContext.tsx` | Add `convertIdeaToTask` and `convertTaskToIdea` functions |
| `src/components/tasks/TaskForm.tsx` | Add "Convert to Idea" button when editing |
| `src/components/ideas/IdeaForm.tsx` | Add "Convert to Task" button when editing |

## User Experience
1. User clicks on an existing task/idea to open the edit form
2. A "Convert to Task" or "Convert to Idea" button appears in the form footer
3. Clicking it converts the item and closes the dialog
4. A toast notification confirms the conversion
5. The new item appears in the appropriate list
