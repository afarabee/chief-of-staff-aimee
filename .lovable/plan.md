

# Add AI Enrichment to Assets

## Overview
Add asset-specific AI enrichment that generates maintenance schedules with frequencies and due dates, displayed differently from task/idea enrichments on the detail page.

---

## Part A: "Enrich with AI" button on asset detail view

### `src/pages/Assets.tsx`
- Add a Sparkles button next to the Edit and Delete buttons in the detail view header (line 187-210)
- Use the `useEnrichAndSave` hook (or a simplified version since assets don't need auto-save -- they already exist)
- Show loading state ("Enriching...") with Loader2 spinner
- The button calls the enrich flow with `item_type: "asset"` and passes full asset context (category, notes, purchase date, description)
- Fetch linked providers and maintenance tasks to include in the enrichment context
- Toast: "AI is analyzing this asset..." while working, success toast with "View" action

### New hook or inline logic
Since assets are always enriched from the detail view (they already exist in DB, no auto-save needed), the flow is simpler:
1. Call `enrich-item` edge function with `item_type: "asset"` and full context
2. Parse returned suggestions (which now include `frequency` and `recommended_due_date`)
3. Insert into `ai_enrichments` with formatted suggestions
4. Show toast with "View" action

This can reuse `useEnrichAndSave` by passing `itemId` (existing asset) with no `onSaveExisting` (skip the save step), or we can create a small `useEnrichAsset` wrapper. The simplest approach: call `useEnrichAndSave.enrich()` with `itemType: 'asset'`, `itemId: asset.id`, and no save callbacks.

**Update `useEnrichAndSave.tsx`:**
- Expand `itemType` union to include `'asset'`
- Make `onSaveNew` and `onSaveExisting` optional (already are)
- For assets, skip auto-save step when no callbacks are provided and `itemId` exists
- Change loading toast for assets: "AI is analyzing this asset..."
- When formatting suggestions for assets, preserve `frequency` and `recommended_due_date` fields

---

## Part B: Asset-specific enrichment in `useEnrichAndSave`

### `src/hooks/useEnrichAndSave.tsx`
- Change `itemType` type from `'task' | 'idea' | 'reminder'` to `'task' | 'idea' | 'reminder' | 'asset'`
- When `itemType === 'asset'`, use a different loading toast message
- When formatting suggestions, detect asset suggestions (they have `frequency`/`recommended_due_date`) and preserve those fields in the JSONB

---

## Part C: Update `enrich-item` Edge Function

### `supabase/functions/enrich-item/index.ts`
- Add a branch: when `item_type === "asset"`, use a different Gemini prompt
- The asset prompt asks for maintenance tasks with `frequency` and `recommended_due_date`
- Update `parseGeminiJsonResponse` to also handle asset-format responses (objects with `suggestion`, `frequency`, `recommended_due_date`)
- Return the raw parsed array (the frontend handles formatting)

Asset prompt (simplified):
```
You are a home and property maintenance expert. Given an asset, suggest specific 
maintenance tasks with recommended frequencies and due dates. Only suggest things 
that have a recurring schedule or deadline. Each suggestion must be a specific 
actionable maintenance event. Format as JSON with: "suggestion", "frequency" 
(e.g. "Every 3 years"), and "recommended_due_date" (YYYY-MM-DD). Return 3-7 
suggestions. Return ONLY a JSON array.
```

The item context will include: asset name, category, description, notes, purchase date, linked provider names, and existing maintenance task names.

---

## Part D: Asset enrichment detail page

### `src/pages/AiEnrichmentDetail.tsx`
- Add `asset` to the `typeBadge` map with a green style
- When `enrichment.item_type === 'asset'`, render suggestion cards differently:
  - Bold suggestion text (maintenance task name)
  - Frequency badge (e.g., "Every 3 years")
  - Formatted recommended due date (e.g., "Jun 1, 2026")
  - Status: pending (gray), accepted (green check), dismissed (hidden)
- Action buttons for asset suggestions:
  - **Edit** (Pencil icon): Makes suggestion text, frequency, and date editable inline. Save/Cancel buttons. Updates JSONB on save.
  - **Accept** (Check icon): Sets status to "accepted" in JSONB
  - **Dismiss** (X icon): Sets status to "dismissed"
  - NO Execute button, NO Create Task button
- For non-asset enrichments, keep existing behavior (Execute, Create Task, Dismiss)

### Inline editing state
- Track `editingIdx` state (which suggestion index is being edited)
- When editing, show Input fields for suggestion text, frequency, and a date picker for due date
- Save button calls `useUpdateEnrichmentSuggestion` to update the suggestion object
- Cancel reverts to read-only

---

## Part E: Update AI Activity list page

### `src/pages/AiActivity.tsx`
- Add "Assets" tab to the filter TabsList
- Add `asset` to the `typeBadge` map with green styling
- For asset enrichments, the summary should show "accepted" count instead of "executed"

---

## Technical Details

### Files to modify:
| File | Changes |
|------|---------|
| `supabase/functions/enrich-item/index.ts` | Add asset-specific prompt branch and context handling |
| `src/hooks/useEnrichAndSave.tsx` | Expand type union to include 'asset', handle asset-specific toast text, preserve frequency/date fields |
| `src/pages/Assets.tsx` | Add Sparkles button to detail view, wire up enrichment flow |
| `src/pages/AiEnrichmentDetail.tsx` | Add asset badge, asset-specific card rendering with frequency/date, inline editing, Accept button |
| `src/pages/AiActivity.tsx` | Add "Assets" filter tab and badge |
| `src/hooks/useAiEnrichments.ts` | No changes needed (already generic) |
| `src/hooks/useUpdateEnrichmentSuggestion.ts` | No changes needed (already updates arbitrary fields in suggestion objects) |

### Suggestion JSONB format for assets:
```json
{
  "suggestion": "Pump septic tank",
  "frequency": "Every 3 years",
  "recommended_due_date": "2026-06-01",
  "status": "pending",
  "result": null
}
```

### No database changes required
The `ai_enrichments` table already supports this -- `suggestions` is JSONB and `item_type` is text, so storing "asset" and extra fields in the suggestion objects works without schema changes.

