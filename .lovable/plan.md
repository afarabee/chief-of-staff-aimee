

# Plan: Create Assets Page

## Overview
Build a full Assets feature with list view (grouped by category), add/edit form (sheet), and detail view -- all connected to the existing Supabase `assets` and `categories` tables. Add navigation entry in the sidebar.

## New Files

### 1. `src/hooks/useAssets.ts`
TanStack Query hooks for the assets table:
- **useAssets()** -- fetches all assets joined with `categories` (name, icon, color) via a Supabase select with join: `.select('*, categories(id, name, icon, color)')`. Returns typed `Asset[]`.
- **useCreateAsset()** -- INSERT mutation, invalidates `['assets']` query, shows toast.
- **useUpdateAsset()** -- UPDATE mutation, invalidates `['assets']` query, shows toast.
- **useDeleteAsset()** -- DELETE mutation, invalidates `['assets']` query, shows toast.
- **useAssetCategories()** -- fetches from the `categories` table (not `cos_categories`) for the category dropdown in the form.

### 2. `src/types/assets.ts`
```
export interface Asset {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  description: string | null;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
```

### 3. `src/pages/Assets.tsx`
Main page component with three view states managed by local state:
- **List View** (default): Page heading "Assets" top-left, "Add Asset" button top-right. Groups assets by category name with section headers showing the lucide icon (rendered dynamically) and category name with color accent. Each asset card shows name (bold), description (muted, truncated), purchase date ("MMM YYYY") on the right, and a chevron-right icon. Clicking a card switches to detail view. Empty state with Package icon and prompt.
- **Detail View**: Back arrow returns to list. Asset name as heading. Category badge with color. Displays description, purchase date ("MMMM d, yyyy"), and notes -- only if they have values. Edit (pencil) and Delete (trash) buttons in top-right. Delete shows confirmation dialog. "Tasks" section with placeholder text. 
- **Add/Edit**: Uses a Sheet (slide-up panel) with form fields: Name (required), Category (select from `categories` table), Description, Purchase Date (date picker), Notes (textarea, 3 rows). Save/Cancel buttons.

### 4. `src/components/assets/AssetForm.tsx`
Reusable form component used inside the Sheet for both add and edit modes. Props: `asset?: Asset`, `onClose: () => void`. Uses the `useAssetCategories()` hook for the category dropdown and `useCreateAsset()` / `useUpdateAsset()` for mutations.

### 5. `src/components/assets/AssetCard.tsx`
Card component for a single asset in the list. Shows name, description (truncated), purchase date, and chevron-right. Accepts `onClick` handler.

## Modified Files

### 6. `src/components/layout/AppSidebar.tsx`
Add a new nav item:
```
{ title: 'Assets', url: '/assets', icon: Package }
```
Import `Package` from lucide-react. Insert it in the `navItems` array (after Categories or wherever feels natural).

### 7. `src/App.tsx`
Add route:
```
<Route path="/assets" element={<Assets />} />
```
Import the `Assets` page component.

## Technical Details

| Detail | Description |
|--------|-------------|
| Tables used | `assets` (with join to `categories`) |
| Category table | `categories` (NOT `cos_categories`) -- this table has `color` and `icon` fields with lucide icon names |
| Dynamic icons | Use `lucide-react`'s `icons` map to render icon by name string (e.g., `icons["Home"]`) |
| Date formatting | `date-fns` `format()` -- "MMM yyyy" for list, "MMMM d, yyyy" for detail |
| Date picker | Shadcn Popover + Calendar with `pointer-events-auto` class |
| Delete confirmation | AlertDialog per existing pattern (memory: deletion-confirmation) |
| Query key | `['assets']` for the asset list, `['asset-categories']` for the categories dropdown |
| Uncategorized assets | Grouped under an "Uncategorized" section header |
| View management | Single `Assets.tsx` page with `useState<'list' | 'detail'>` and `selectedAsset` state -- no extra routes needed |

