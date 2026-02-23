

# Fix Asset Enrichment Flow

## Overview
Three changes to keep asset enrichments self-contained on the asset detail page and out of the AI Activity hub.

---

## Change 1: Asset-specific success toast (no navigation)

**File: `src/hooks/useEnrichAndSave.tsx`** (lines 92-96)

Replace the single toast block with a conditional:
- If `itemType === 'asset'`: show a simple toast with title "Maintenance schedule generated!" and description showing suggestion count. No action button, no navigation.
- Otherwise: keep the existing toast with the "View" action button navigating to `/ai-activity`.

---

## Change 2: Exclude assets from AI Activity page

**File: `src/hooks/useAiEnrichments.ts`** (lines 25-33)

After building the base query, always add `.neq('item_type', 'asset')` to filter out asset enrichment records. This ensures no asset records appear on the AI Activity list regardless of the selected filter tab.

**File: `src/pages/AiActivity.tsx`** (line 70)

Remove the `<TabsTrigger value="asset">Assets</TabsTrigger>` tab and the `asset` entry from the `typeBadge` map (line 30).

---

## Change 3: Verify asset detail page (already implemented)

The Maintenance Schedule section, `useAssetEnrichment` hook, and `AssetSuggestionsSection` component are already in place from the previous implementation. The query invalidation in `useEnrichAndSave.tsx` (line 87) already refreshes the asset page after enrichment. No changes needed here.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/hooks/useEnrichAndSave.tsx` | Conditional toast: simple message for assets, "View" action for others |
| `src/hooks/useAiEnrichments.ts` | Add `.neq('item_type', 'asset')` filter to exclude asset records |
| `src/pages/AiActivity.tsx` | Remove "Assets" tab and badge entry |

