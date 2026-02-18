
# Mobile Responsiveness Fix

## Overview
Fix all mobile usability issues across the app: modals that overflow the screen, sidebar that stays open after navigation, the Today view layout, and general touch/spacing improvements. On mobile (below 768px), all form dialogs will render as full-screen bottom sheets instead of centered dialogs.

## What You'll See
- On phones, all add/edit forms (Tasks, Ideas, Reminders, Assets, Providers) slide up as full-screen bottom sheets with a scrollable body and fixed header/footer
- Tapping a sidebar nav link automatically closes the sidebar
- The Today dashboard stacks cards vertically on mobile with proper spacing
- AI Suggestion action buttons stack below the suggestion text on mobile
- All buttons meet 44px minimum touch target size on mobile
- No content touches screen edges (proper padding throughout)

## Technical Details

### 1. Create a `ResponsiveFormDialog` wrapper component
**File:** `src/components/ui/responsive-dialog.tsx`

A new component that renders a `Dialog` on desktop and a full-screen `Sheet` (side="bottom") on mobile, using the existing `useIsMobile()` hook.

Props: `open`, `onOpenChange`, `title` (string), `children` (the form content).

On mobile (Sheet):
- Full width, max-height 95vh
- Flex column layout with sticky header (title + close), scrollable body, no separate footer (forms handle their own buttons inside the scroll area)
- `overflow-y: auto`, `overflow-x: hidden` on the body
- Extra bottom padding (`pb-8`) to account for safe areas

On desktop (Dialog):
- Keep current behavior: centered, max-w-lg, max-h-[85vh], overflow-y-auto, overflow-x-hidden

### 2. Replace Dialog usage in all form modals
**Files modified:**
- `src/pages/Tasks.tsx` -- Task edit dialog and maintenance sheet
- `src/pages/Ideas.tsx` -- Idea edit dialog
- `src/pages/Maintenance.tsx` -- Reminder edit dialog
- `src/pages/Assets.tsx` -- Asset edit dialog (list view + detail view + inner task dialog)
- `src/pages/Providers.tsx` -- Provider edit dialog + task dialog (list + detail)
- `src/pages/Calendar.tsx` -- Create/edit kanban and maintenance dialogs
- `src/pages/Index.tsx` -- Task and Idea edit dialogs
- `src/pages/CategoryDetail.tsx` -- Task and Idea edit dialogs
- `src/pages/Categories.tsx` -- Category create/edit dialog (if it can overflow)

Replace `<Dialog>` + `<DialogContent>` + `<DialogHeader>` + `<DialogTitle>` pattern with `<ResponsiveFormDialog title="..." open={...} onOpenChange={...}>`. The form remains as children.

### 3. Auto-close sidebar on mobile navigation
**File:** `src/components/layout/AppSidebar.tsx`

- Import `useSidebar` (already imported) and extract `setOpenMobile` and `isMobile`
- Add an `onClick` handler to each `NavLink` that calls `setOpenMobile(false)` when `isMobile` is true
- This closes the Sheet-based mobile sidebar after tapping a link

### 4. Make the Today view responsive
**File:** `src/pages/Index.tsx`

- Change `grid gap-8 lg:grid-cols-2` to `grid gap-4 md:gap-8 md:grid-cols-2` so cards stack on mobile
- Reduce the main container padding reference: in `AppLayout.tsx`, change `p-8` to `p-4 md:p-8`
- Ensure the quick capture input and button have proper mobile sizing

### 5. Update AppLayout padding for mobile
**File:** `src/components/layout/AppLayout.tsx`

- Change `<div className="p-8">` to `<div className="p-4 md:p-8">` for mobile-friendly padding
- Change header `px-6` to `px-4 md:px-6`

### 6. Mobile-friendly AI Suggestions
**File:** `src/components/ai/EnrichWithAI.tsx`

- Change the suggestion row from `flex items-start gap-2` to `flex flex-col sm:flex-row sm:items-start gap-2`
- On mobile: suggestion text takes full width, action buttons row below it (horizontally)
- Ensure action buttons are at least 44px touch targets on mobile: `h-7 w-7 sm:h-7 sm:w-7` stays, but add `min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0` or simply increase to `h-10 w-10 sm:h-7 sm:w-7`

### 7. General mobile touch-target improvements
- Buttons in forms already use shadcn defaults which are generally fine
- The sidebar nav items already have adequate height from SidebarMenuButton

### Files Created
- `src/components/ui/responsive-dialog.tsx`

### Files Modified
- `src/components/layout/AppSidebar.tsx` -- auto-close on mobile nav
- `src/components/layout/AppLayout.tsx` -- responsive padding
- `src/pages/Tasks.tsx` -- use ResponsiveFormDialog
- `src/pages/Ideas.tsx` -- use ResponsiveFormDialog
- `src/pages/Maintenance.tsx` -- use ResponsiveFormDialog
- `src/pages/Assets.tsx` -- use ResponsiveFormDialog
- `src/pages/Providers.tsx` -- use ResponsiveFormDialog
- `src/pages/Calendar.tsx` -- use ResponsiveFormDialog
- `src/pages/Index.tsx` -- responsive grid + use ResponsiveFormDialog
- `src/pages/CategoryDetail.tsx` -- use ResponsiveFormDialog
- `src/pages/Categories.tsx` -- use ResponsiveFormDialog
- `src/components/ai/EnrichWithAI.tsx` -- stack suggestion buttons on mobile
