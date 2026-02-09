

# Handle Completed/Done Tasks on Calendar

## Overview
Gray out completed tasks, add strikethrough in daily view, and add a "Show completed" toggle to the calendar header.

## Helper Function
Add a reusable helper `isItemCompleted(item)` that returns `true` when a Kanban task has status `done` or a maintenance task has status `completed`. This will be used across all view components.

## Changes

### 1. `src/pages/Calendar.tsx`
- Add `showCompleted` state (default `true`)
- Add a Switch toggle in the header area (near the legend row) labeled "Show completed"
- Derive a filtered `filteredItems` list: when `showCompleted` is false, filter out completed items; pass `filteredItems` to all view components
- Import `Switch` from `@/components/ui/switch` and `Label` from `@/components/ui/label`

### 2. `src/components/calendar/MonthlyView.tsx`
- **Mobile dots**: Use `bg-gray-300` instead of `bg-primary`/`bg-orange-500` when the item is completed
- **Desktop pills**: Use `bg-gray-300 text-gray-500` instead of the colored backgrounds when completed

### 3. `src/components/calendar/WeeklyView.tsx`
- **Task cards**: When completed, apply `opacity-60` to the card button
- **Type badge**: Use `bg-gray-200 text-gray-500` instead of the colored badge styles when completed
- **Status badge**: Already shows status text, no change needed

### 4. `src/components/calendar/DailyView.tsx`
- When a task is completed, add `opacity-60` to the card and `line-through` to the title text
- Applies to both Kanban and Maintenance task cards

### 5. `src/components/calendar/TaskPopover.tsx`
- When the item is completed, use `bg-gray-300 text-gray-500` for the type badge instead of the primary/orange color

### 6. `src/hooks/useCalendarTasks.ts`
- No changes needed -- it already fetches completed tasks (done in last 7 days). The filtering is handled client-side in Calendar.tsx.

## Technical Details
- The completed check: `(item.type === 'kanban' && item.status === 'done') || (item.type === 'maintenance' && item.status === 'completed')`
- Toggle state is session-only React state, no persistence
- All 4 view/interaction components get the same `items` prop -- filtering happens once at the page level before passing down
