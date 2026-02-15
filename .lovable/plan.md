

# Rename All User-Facing "Maintenance Task" to "Reminder"

## Overview
Every user-facing string referencing "maintenance task" or "maintenance" (including the sidebar label and page heading) changes to "Reminder(s)." Internal code (types, hooks, file names, DB columns) stays the same.

## Changes by File

### 1. `src/components/layout/AppSidebar.tsx`
- Sidebar nav label "Maintenance" -> **"Reminders"**

### 2. `src/pages/Maintenance.tsx`
- Page heading "Maintenance" -> **"Reminders"**
- `usePageTitle('Maintenance')` -> `usePageTitle('Reminders')`
- "Add Task" buttons -> **"Add Reminder"**
- Empty state text -> **"No reminders yet. Add a reminder or generate a maintenance plan from an asset."**
- Dialog title: "Add Maintenance Task" -> **"Add Reminder"**, "Edit Task" -> **"Edit Reminder"**
- "No upcoming tasks" -> **"No upcoming reminders"**

### 3. `src/components/maintenance/MaintenanceTaskForm.tsx`
- "Task Name *" label -> **"Reminder Name *"**

### 4. `src/hooks/useMaintenanceTasks.ts`
- "Task added" -> **"Reminder added"**
- "Task updated" -> **"Reminder updated"**
- "Task deleted" -> **"Reminder deleted"**
- "Task completed..." -> **"Reminder completed..."**

### 5. `src/pages/Calendar.tsx`
- Legend label "Maintenance Tasks" -> **"Reminders"**
- Dialog title "New Maintenance Task" -> **"New Reminder"**

### 6. `src/components/calendar/CreateTaskDialog.tsx`
- "Maintenance Task" button label -> **"Reminder"**
- Subtitle -> **"Schedule a maintenance reminder"**

### 7. `src/components/calendar/TaskPopover.tsx`
- Badge "Maintenance Task" -> **"Reminder"**

### 8. `src/components/calendar/DailyView.tsx`
- Section heading "Maintenance Tasks" -> **"Reminders"**

### 9. `src/pages/Assets.tsx`
- "Add Task" -> **"Add Reminder"**
- Dialog titles -> **"Add Reminder"** / **"Edit Reminder"**

### 10. `src/pages/Providers.tsx`
- Section heading "Maintenance Tasks" -> **"Reminders"**
- "Add Task" -> **"Add Reminder"**
- Empty state -> **"No reminders for this provider"**
- Dialog titles -> **"Add Reminder"** / **"Edit Reminder"**

### 11. `src/pages/Tasks.tsx`
- Sheet title "Edit Maintenance Task" -> **"Edit Reminder"**

### 12. `supabase/functions/chat/index.ts`
- Update AI system prompt to use "reminders" terminology

## What Does NOT Change
- File names, component names, hook names, TypeScript types, database tables/columns
- Internal code comments (only user-visible strings change)

