

# Plan: Quick Search Modal (Command Palette Style)

## Overview
Instead of navigating to a separate search page, a search modal pops up over whatever page you're on. You type your query, pick scope (Tasks / Ideas / Both), and see results inline. Clicking a result could expand/edit it. The scope defaults to "Both".

## How It Works
- A **Search icon button** in the app header bar (next to the sidebar trigger) opens the modal
- **Keyboard shortcut**: Cmd+K (Mac) / Ctrl+K (Windows) opens it from anywhere
- The modal uses the existing `CommandDialog` component (already installed via `cmdk`)
- Scope toggle at the top: Tasks | Ideas | Both (default: **Both**)
- Results grouped by type, showing title and description preview
- Clicking a result navigates to the relevant page (/tasks or /ideas)
- Modal closes on selection or Escape

## Files to Create

### `src/components/search/SearchModal.tsx`
- Uses `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty`
- Accepts `open` and `onOpenChange` props
- Scope toggle using `ToggleGroup` (Tasks / Ideas / Both), defaulting to "Both"
- Pulls data from `useApp()` context
- Filters tasks and ideas by title/description (case-insensitive)
- Groups results into "Tasks" and "Ideas" `CommandGroup` sections
- Each result shows an icon (CheckSquare for tasks, Lightbulb for ideas), title, and truncated description
- On item select, navigates to `/tasks` or `/ideas` and closes the modal

## Files to Modify

### `src/components/layout/AppLayout.tsx`
- Add search state (`open` / `setOpen`)
- Add a Search icon button in the header (next to `SidebarTrigger`)
- Register a global `Cmd+K` / `Ctrl+K` keyboard listener to toggle the modal
- Render `SearchModal` component

## Technical Notes

| Detail | Value |
|--------|-------|
| Library | `cmdk` (already installed) via `CommandDialog` |
| Scope default | Both |
| Keyboard shortcut | Cmd+K / Ctrl+K |
| Search fields | `title` and `description` |
| Navigation on select | Uses `react-router-dom` `useNavigate` |
| No new route needed | Modal overlays current page |

