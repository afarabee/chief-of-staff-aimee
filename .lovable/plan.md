

# Add Calendar Page

## Overview
Create a new Calendar page at `/calendar` with monthly, weekly, and daily views showing both Kanban tasks (from `cos_tasks`) and maintenance tasks (from `tasks`), color-coded by type.

## New Files

### 1. `src/hooks/useCalendarTasks.ts`
Custom hook that fetches from both tables using TanStack Query:
- **Kanban tasks**: `cos_tasks` where `due_date IS NOT NULL` and (`status != 'done'` OR completed in last 7 days)
- **Maintenance tasks**: `tasks` where `next_due_date IS NOT NULL` and (`status != 'completed'` OR completed in last 7 days), with joined `assets.name` and `service_providers.name`
- Normalizes both into a unified `CalendarItem` type
- Query keys: `['calendar-kanban-tasks']` and `['calendar-maintenance-tasks']`

### 2. `src/pages/Calendar.tsx`
Main calendar page with:
- **State**: `currentDate`, `view` (monthly/weekly/daily)
- **Header**: page title, ToggleGroup for view selection (Monthly default), ChevronLeft/ChevronRight navigation, period label, "Today" button
- **Legend**: colored dots for Kanban (primary) and Maintenance (orange/teal)
- **Conditional rendering** of MonthlyView, WeeklyView, or DailyView components
- **Task popover** and **create-task dialog** managed at page level
- Reuses existing `TaskForm` and `MaintenanceTaskForm` in Dialog wrappers for edit/create, pre-filling dates when creating from calendar

### 3. `src/components/calendar/MonthlyView.tsx`
- CSS grid, 7 columns (Sun-Sat), header row with day names
- Day cells: day number, colored pills for tasks (truncated titles), "+N more" overflow
- Today highlighted, adjacent-month days muted
- Click day number -> switch to daily view; click pill -> open popover; click empty day -> create task dialog
- Mobile (<640px): dots instead of text pills

### 4. `src/components/calendar/WeeklyView.tsx`
- 7-column layout for one week
- Column headers: day name + date, today highlighted
- Task cards with title, type badge, status label
- Click task -> popover; click empty area -> create task dialog

### 5. `src/components/calendar/DailyView.tsx`
- Single day detail view with tasks grouped by type (Kanban section, Maintenance section)
- Kanban cards: title, status badge, priority badge, description snippet
- Maintenance cards: title, status badge, asset name, provider name, recurrence
- Empty state with "Add a task" button
- Click task -> popover

### 6. `src/components/calendar/TaskPopover.tsx`
- Popover showing task details: title, type badge, status, priority (kanban only), due date, asset/provider (maintenance only), description snippet
- "Edit" button opens appropriate existing form dialog

### 7. `src/components/calendar/CreateTaskDialog.tsx`
- Small dialog asking "What type of task?" with two buttons: "Kanban Task" and "Maintenance Task"
- Opens the existing `TaskForm` or `MaintenanceTaskForm` with date pre-filled

## Modified Files

### 8. `src/App.tsx`
- Import `Calendar` page (lazy or direct)
- Add route: `<Route path="/calendar" element={<CalendarPage />} />`

### 9. `src/components/layout/AppSidebar.tsx`
- Add nav item `{ title: 'Calendar', url: '/calendar', icon: Calendar }` (Calendar icon already imported)
- Place it after "Today" and before "Tasks" in the nav order

### 10. `src/hooks/useMaintenanceTasks.ts`
- Add `['calendar-maintenance-tasks']` to the `ALL_KEYS` array so calendar data is invalidated when maintenance tasks are created/edited

### 11. `src/hooks/useTasks.ts`
- Add `queryClient.invalidateQueries({ queryKey: ['calendar-kanban-tasks'] })` in create/update/delete success handlers

## Technical Details

- **Date math**: All calculations use `date-fns` (startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isSameMonth, isToday)
- **No third-party calendar library** -- built with CSS grid + date-fns
- **Client-side filtering**: Data fetched once per query, filtered by visible date range in useMemo
- **Colors**: Kanban tasks use `bg-primary` (app primary); Maintenance tasks use `bg-orange-500` for good contrast
- **Responsive**: Monthly view shows dots on mobile; Weekly view stacks vertically; Daily view is full-width
- **Existing form reuse**: TaskForm and MaintenanceTaskForm are rendered inside Dialog wrappers, with initial date values passed as props where the forms accept them (MaintenanceTaskForm already initializes `dueDate` from `task?.nextDueDate`; TaskForm initializes from `task?.dueDate`)

