

# Add Task Creation from Calendar Page

## Overview
Enable creating tasks directly from the calendar in two ways: clicking empty space on a day (with date pre-filled), and a floating "+" button (no date pre-filled). Most of the infrastructure already exists -- this plan refines the existing behavior and fills gaps.

## What Already Works
- CreateTaskDialog (type chooser) exists and is wired up
- Empty day click opens the dialog in Monthly and Weekly views
- Daily view has "Add Task" button and empty state
- TaskForm and MaintenanceTaskForm are rendered in Dialogs
- Cache invalidation already covers calendar query keys

## Changes Needed

### 1. `src/components/calendar/CreateTaskDialog.tsx`
- Accept an optional `date` prop
- Update dialog title: if date is provided, show "New Task for Feb 12, 2026" (formatted); otherwise show "New Task"

### 2. `src/pages/Calendar.tsx`
- Add a floating "+" button in the header area (near legend/toggle row) that opens CreateTaskDialog with no date
- Add state for "no-date create" flow (set `createDate` to a sentinel or use a separate boolean)
- Pass `createDate` to CreateTaskDialog for the title
- Ensure the create dialog shows properly for both flows (with date and without date)

### 3. `src/components/calendar/MonthlyView.tsx`
- **Key change**: Allow adding tasks to days that already have items. Currently, clicking the date number on a day with items navigates to daily view. Add a small "+ Add" link below the task pills (similar to the "+N more" overflow link) so users can create tasks on days that already have items.
- On task pill buttons, add `e.stopPropagation()` via `onClick` to prevent bubbling to day container (already isolated since pills are inside TaskPopover triggers)

### 4. `src/components/calendar/WeeklyView.tsx`
- Show the "+ Add" button on ALL days, not just empty ones. Move it outside the `dayItems.length === 0` conditional so it always appears at the bottom of each day column.
- Add `e.stopPropagation()` on task card buttons

### 5. `src/components/calendar/DailyView.tsx`
- Already has the "Add a task" button and empty state -- no changes needed

### 6. TaskForm date pre-fill
- Already works: Calendar.tsx passes `{ dueDate: createDate }` as the task prop, and TaskForm reads `task?.dueDate` to initialize state. No changes needed.

### 7. MaintenanceTaskForm date pre-fill
- Already works: Calendar.tsx passes `{ nextDueDate: format(createDate, 'yyyy-MM-dd') }` and the form reads `task?.nextDueDate`. No changes needed.

## Technical Details

### CreateTaskDialog title logic
```
title = date ? `New Task for ${format(date, 'MMM d, yyyy')}` : 'New Task'
```

### Floating "+" button
- Placed in the legend row, between the "Show completed" toggle and the legend dots
- Uses `Button` with `variant="outline"` and `size="icon"`, containing a `Plus` icon
- onClick sets a flag to open CreateTaskDialog without a date

### State management for no-date flow
- Use a new `showCreateNoDate` boolean state
- When "+" is clicked: `setShowCreateNoDate(true)`
- CreateTaskDialog `open` becomes `(!!createDate && !createType) || (showCreateNoDate && !createType)`
- When type is selected: proceed to open TaskForm/MaintenanceTaskForm without pre-filling date
- On close: reset both `createDate` and `showCreateNoDate`

### Monthly view "+ Add" for non-empty days
- Add a small `+ Add` button after the pills list (visible on desktop) and after dots (visible on mobile)
- This button calls `onEmptyDayClick(day)` with `e.stopPropagation()`

