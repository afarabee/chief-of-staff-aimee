

# Connect Chief of Staff to Supabase

This plan replaces the local mock data with real Supabase database queries, enabling persistent storage for tasks and ideas.

## Overview

The app will transition from in-memory state management to Supabase-backed data. All create, read, update, and delete operations will sync with the `cos_tasks` and `cos_ideas` tables.

## Database Mapping

The existing Supabase tables map well to our app types:

```text
+------------------+     +------------------+
|   cos_tasks      |     |   cos_ideas      |
+------------------+     +------------------+
| id (uuid)        |     | id (uuid)        |
| title (text)     |     | title (text)     |
| description      |     | description      |
| due_date (date)  |     | status (text)    |
| status (text)    |     | created_at       |
| priority (text)  |     | updated_at       |
| created_at       |     +------------------+
| updated_at       |
+------------------+
```

**Status value mapping needed:**
- App uses: `backlog`, `to-do`, `in-progress`, `blocked`, `done`
- Database defaults: `To-Do`, `Medium`

The code will handle case-insensitive matching and normalize values.

## Implementation Steps

### 1. Enable RLS on cos_tasks and cos_ideas

The database linter shows these tables don't have Row Level Security enabled. For now, we'll enable RLS with permissive policies (anyone can read/write) since there's no authentication. This can be tightened later when you add user accounts.

**SQL Migration:**
```sql
ALTER TABLE cos_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cos_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to cos_tasks" ON cos_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cos_ideas" ON cos_ideas FOR ALL USING (true) WITH CHECK (true);
```

### 2. Create Custom React Query Hooks

Create a new hooks file that provides data fetching and mutations using TanStack Query (already installed):

**New file: `src/hooks/useTasks.ts`**
- `useTasks()` - Fetches all tasks from `cos_tasks`
- `useCreateTask()` - Inserts a new task
- `useUpdateTask()` - Updates an existing task
- `useDeleteTask()` - Deletes a task

**New file: `src/hooks/useIdeas.ts`**
- `useIdeas()` - Fetches all ideas from `cos_ideas`
- `useCreateIdea()` - Inserts a new idea
- `useUpdateIdea()` - Updates an existing idea
- `useDeleteIdea()` - Deletes an idea

Each hook will:
- Transform database snake_case to app camelCase
- Handle loading and error states
- Invalidate queries after mutations for instant UI updates
- Show toast notifications on success/error

### 3. Update App Context

Refactor `AppContext.tsx` to:
- Remove mock data import
- Use the new React Query hooks for all operations
- Keep the same API surface so existing components continue to work
- Add `isLoading` and `error` states for UI feedback

### 4. Update Components

**TaskForm.tsx & IdeaForm.tsx:**
- Update to call the mutation hooks
- Show loading state while saving
- Handle errors with toast messages

**TaskCard.tsx & IdeaCard.tsx:**
- Update delete functionality to use mutation hooks
- Show loading indicators during operations

**Pages (Index, Tasks, Ideas):**
- Add loading skeletons while data fetches
- Handle empty database state gracefully

### 5. Data Type Alignment

Create helper functions to convert between app types and database types:

```typescript
// Convert database record to app type
function dbTaskToTask(dbTask: Tables<'cos_tasks'>): Task

// Convert app type to database format
function taskToDbTask(task: Partial<Task>): TablesInsert<'cos_tasks'>
```

## Technical Details

### Query Keys Structure
```typescript
queryKeys = {
  tasks: ['tasks'],
  ideas: ['ideas']
}
```

### Error Handling
- All mutations wrapped in try/catch
- Toast notifications for user feedback
- Console logging for debugging

### Loading States
- Skeleton UI while fetching initial data
- Button disabled states during mutations
- Optimistic updates where appropriate

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useTasks.ts` | Create |
| `src/hooks/useIdeas.ts` | Create |
| `src/contexts/AppContext.tsx` | Modify |
| `src/components/tasks/TaskForm.tsx` | Modify |
| `src/components/tasks/TaskCard.tsx` | Modify |
| `src/components/ideas/IdeaForm.tsx` | Modify |
| `src/components/ideas/IdeaCard.tsx` | Modify |
| `src/pages/Index.tsx` | Modify (add loading states) |
| `src/pages/Tasks.tsx` | Modify (add loading states) |
| `src/pages/Ideas.tsx` | Modify (add loading states) |
| `src/data/mockData.ts` | Can be removed |

## Security Note

The current implementation uses open RLS policies (`USING (true)`). This is fine for development and single-user scenarios. When you're ready to add authentication:
1. Add user_id columns to both tables
2. Update RLS policies to restrict access to authenticated users' own data
3. Connect Supabase Auth

