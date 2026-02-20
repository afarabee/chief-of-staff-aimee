
# Fix Dashboard Mobile Layout (below 768px)

## Issues Found

1. **Page title + QuickAdd header** (line 147): `flex items-center gap-4` can overflow horizontally when the date text is long on a narrow screen
2. **Task titles not truncating** (TaskCard line 113): Title `h3` has no `truncate` or `min-w-0` constraint, so long titles push content wider than the viewport
3. **Idea titles not truncating** (IdeaCard line 83): Same issue
4. **No overflow protection on page container**: The root `div` in Index.tsx has no `overflow-x-hidden`, allowing child content to cause horizontal scroll
5. **Button touch targets**: Several buttons (like "View all", delete icons) are smaller than 44px on mobile
6. **AppLayout padding**: Already `p-4 md:p-8` which is fine, but the content inside can still overflow

## Changes

### 1. `src/pages/Index.tsx` -- Mobile-safe layout
- Line 146: Add `overflow-x-hidden` to the root container div
- Line 147-159: Change header from horizontal flex to stacked layout on mobile: `flex flex-col-reverse sm:flex-row sm:items-center gap-4`
- Line 149: Make the title text responsive: `text-2xl sm:text-3xl`
- Line 170: Make the "Save" button 44px tall on mobile: add `min-h-[44px]`
- Lines 189, 224, 260, 295: Make "View all" buttons 44px tap targets on mobile: add `min-h-[44px]`

### 2. `src/components/tasks/TaskCard.tsx` -- Truncate titles
- Line 113: Add `truncate` to the title `h3` so long task names get ellipsis instead of overflowing
- Line 90: Add `overflow-hidden` to the card container

### 3. `src/components/ideas/IdeaCard.tsx` -- Truncate titles
- Line 83: Add `truncate` to the title `h3`
- Line 76: Add `overflow-hidden` to the card container

### 4. `src/components/dashboard/QuickAdd.tsx` -- Touch-friendly button
- Line 23: Ensure the Quick Add button meets 44px minimum height (already `size="lg"` which should be fine, but add `min-h-[44px]` explicitly)

## Technical Details

All changes use Tailwind responsive prefixes (no prefix = mobile-first, `sm:` = 640px+, `md:` = 768px+) and are purely additive CSS class changes. No logic or structural changes needed.
