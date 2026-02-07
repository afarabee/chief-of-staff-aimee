

# Plan: Improve Date Picker with Month/Year Dropdowns

## Problem
The current calendar only has left/right arrows to navigate month by month, making it tedious to pick dates far in the past or future.

## Solution
Enhance the shared `Calendar` component to replace the plain month/year label with **dropdown selects for month and year**. This way, you can jump directly to any month/year combination. Since all date pickers in the app use this one component, every form benefits automatically.

## Changes

### 1. `src/components/ui/calendar.tsx`
Replace the default caption (which just shows "February 2026" as text) with a custom `Caption` component that renders two native `<select>` dropdowns side by side -- one for month (January-December) and one for year (ranging from 10 years in the past to 10 years in the future). When a dropdown value changes, it calls `goToMonth()` from react-day-picker to navigate the calendar instantly.

This is a single-file change. No other files need to be modified since `AssetForm`, `TaskForm`, and `MaintenanceTaskForm` all import from `@/components/ui/calendar`.

## Technical Notes

- Uses react-day-picker's built-in `useNavigation()` hook and custom `components.Caption` prop to override the header
- The year range (current year minus 10 to plus 10) covers reasonable past purchase dates and future maintenance schedules
- The dropdowns are styled to match the existing shadcn theme (border, rounded corners, text size)
- The left/right arrow navigation buttons are preserved alongside the dropdowns for quick single-month steps
