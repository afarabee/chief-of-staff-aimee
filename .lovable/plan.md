

# Fix: Preserve `bundled_items` when saving AI enrichment suggestions

## Problem
The `formattedSuggestions` mapping in `useEnrichAndSave.tsx` explicitly picks only `suggestion`, `status`, `result`, `frequency`, and `recommended_due_date` -- dropping `bundled_items` from the AI response before saving to the database.

## Fix
Add one line to the mapping in `src/hooks/useEnrichAndSave.tsx` (line ~72) to spread `bundled_items` when present:

```tsx
...(s.bundled_items ? { bundled_items: s.bundled_items } : {}),
```

This is a single-line addition to the existing spread pattern. No database, schema, or other file changes needed.
