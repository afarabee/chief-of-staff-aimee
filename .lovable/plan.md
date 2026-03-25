

# Improve Title Generation Across All Conversions

## Problem
Titles generated when converting items (AI results to tasks/ideas, maintenance to calendar, subtasks from suggestions) are too long and sentence-like. Need concise, title-case summaries of ~25 characters everywhere.

## Solution
Create a shared `generateTitle` utility and apply it at every conversion point in the app.

## Changes

### New: `src/utils/generateTitle.ts`
Shared function `generateTitle(text: string, maxLength = 25): string`:
1. Strip markdown (bold, headers, bullets, numbered lists)
2. Remove conversational filler ("Okay, here's", "Sure, ", "Here is", "Here are", "So, ", "Alright, ", "Let me", etc.)
3. Remove leading articles/prepositions when they make the title too long ("a ", "an ", "the ")
4. Take first non-empty line
5. Remove trailing punctuation (periods, colons, commas, ellipsis)
6. Truncate at word boundary to `maxLength`
7. Apply Title Case
8. Fallback to "AI Result"

### `src/pages/AiEnrichmentDetail.tsx`
- Replace inline `generateTitleFromResult` with `generateTitle` import
- Use for both executed-result and pending-suggestion title generation

### `src/hooks/useCreateSubtask.ts`
- Import `generateTitle` and use it for both the `title` param (when provided) and the fallback from `suggestion`
- Replace the 80-char truncation logic

### `src/components/assets/AssetSuggestionsSection.tsx`
- Use `generateTitle` when building the `summary` field for calendar scheduling (the `summary` passed to `useScheduleToCalendar`), keeping `"AssetName: <generated title>"` format

### `src/pages/Maintenance.tsx`
- Use `generateTitle` for the calendar event `summary` in both single and bulk scheduling (`handleScheduleConfirm`), keeping `"AssetName: <generated title>"` format

### `src/hooks/useBulkScheduleToCalendar.ts`
- Use `generateTitle` for the `summary` field when bulk-scheduling maintenance events

### `src/contexts/AppContext.tsx`
- No changes needed here — idea-to-task and task-to-idea conversions preserve the existing title, which is already user-authored

## Files

| File | Change |
|------|--------|
| `src/utils/generateTitle.ts` | New shared utility |
| `src/pages/AiEnrichmentDetail.tsx` | Use shared utility |
| `src/hooks/useCreateSubtask.ts` | Use shared utility |
| `src/components/assets/AssetSuggestionsSection.tsx` | Use shared utility for calendar summaries |
| `src/pages/Maintenance.tsx` | Use shared utility for calendar summaries |
| `src/hooks/useBulkScheduleToCalendar.ts` | Use shared utility for calendar summaries |

