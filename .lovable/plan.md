

# Add "Create Task" and "Create Idea" buttons for executed suggestions

## Problem
When an AI suggestion has been executed and shows a result, there are no action buttons to convert that result into a Task or Idea. The "Create Task" button only appears for pending (unexecuted) suggestions.

## Solution
Add "Create Task" and "Create Idea" buttons inside the executed suggestion result area. When clicked, they will:
1. Generate a short title from the result text (first ~80 chars of the first meaningful line)
2. Create the task or idea with the full result as the description

## Changes

### `src/pages/AiEnrichmentDetail.tsx`

- Import `Lightbulb` icon from lucide-react (for "Create Idea")
- Track created items for executed suggestions with a new state: `createdFromResultIdx` storing `Set<string>` (e.g. `"3-task"`, `"3-idea"`)
- After the existing `s.status === 'executed' && s.result` collapsible block (lines 317-348), add two buttons inside the result area next to the Copy button:
  - **Create Task** — calls `createSubtask.mutate()` with the result text as the suggestion content (which becomes the description), and a truncated title derived from the first line of the result
  - **Create Idea** — calls a new inline function that inserts into `cos_ideas` with a truncated title and the full result as description, then invalidates `['ideas']` and toasts

### `src/hooks/useCreateSubtask.ts`

- Add an optional `title` override parameter so callers can pass a custom short title instead of having it auto-derived from the suggestion text
- When `title` is provided, use it directly; otherwise keep existing truncation logic

### Title generation logic (in AiEnrichmentDetail)

- Strip markdown formatting from result text
- Take the first non-empty line, truncate to 80 chars
- Use as the task/idea title
- Full result text becomes the description

### Files
| File | Change |
|------|--------|
| `src/pages/AiEnrichmentDetail.tsx` | Add Create Task + Create Idea buttons for executed suggestions |
| `src/hooks/useCreateSubtask.ts` | Accept optional `title` override param |

