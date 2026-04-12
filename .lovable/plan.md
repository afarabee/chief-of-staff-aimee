

# Fix Asset Dialog Cutoff

## Problem
The asset edit dialog uses `max-w-lg` (32rem / 512px) with `overflow-x-hidden`, which clips the attachment rename UI. The inline rename input + confirm button can't be fully accessed.

## Solution
Two changes to fix this:

1. **Widen the dialog for assets** — Change `ResponsiveFormDialog` desktop `max-w-lg` to `max-w-2xl` so the form has enough room for attachment rows with rename controls.

2. **Ensure attachment rename row doesn't overflow** — In `AssetAttachments.tsx`, add `overflow-hidden` and `min-w-0` to the editing container so the input shrinks to fit rather than pushing content off-screen.

## Files to change

| File | Change |
|------|--------|
| `src/components/ui/responsive-dialog.tsx` | Change `max-w-lg` to `max-w-2xl` on desktop `DialogContent` |
| `src/components/assets/AssetAttachments.tsx` | Add `overflow-hidden` to the editing flex container to prevent overflow |

