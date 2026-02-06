

# Plan: Move Search to Left Side with Inline Search Field

## Overview
Reposition the search icon to the left side of the header (after the sidebar trigger) and add a text input field next to it. Users can either click the search icon to open the modal, or start typing directly in the input field -- which will also open the modal with the typed text pre-filled.

## Changes

### `src/components/layout/AppLayout.tsx`
- Move the search icon button from `ml-auto` (right side) to right after the `SidebarTrigger`
- Add an `Input` field next to the icon, styled as a subtle search bar (e.g., placeholder "Search tasks and ideas..." with muted styling)
- Track the input value in local state
- When the user types into the input field, open the `SearchModal` and pass the typed text as an initial query
- Clear the input field when the modal opens (the modal's own input takes over)

### `src/components/search/SearchModal.tsx`
- Accept an optional `initialQuery` prop
- When the modal opens with an `initialQuery`, pre-fill the `CommandInput` value so the user sees results immediately
- Use a controlled value on `CommandInput` initialized from `initialQuery`

## Technical Details

| Detail | Description |
|--------|-------------|
| File | `src/components/layout/AppLayout.tsx` -- move search left, add input |
| File | `src/components/search/SearchModal.tsx` -- add `initialQuery` prop |
| Behavior | Typing in header input opens modal with that text pre-filled |
| Behavior | Clicking search icon opens modal with empty query |
| Keyboard shortcut | Cmd+K / Ctrl+K still works as before |

