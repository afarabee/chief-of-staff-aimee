
# Plan: Create Service Providers Page

## Overview
Build a Providers feature mirroring the Assets page pattern -- list view grouped by category, detail view with contact links, add/edit sheet form -- connected to the existing `service_providers` and `categories` tables.

## New Files

### 1. `src/types/providers.ts`
Define a `Provider` interface with fields: id, name, phone, email, address, website, notes, categoryId, categoryName, categoryIcon, categoryColor, createdAt, updatedAt.

### 2. `src/hooks/useProviders.ts`
TanStack Query hooks following the same pattern as `useAssets.ts`:
- **useProviders()** -- fetches all providers with `.select('*, categories(id, name, icon, color)')`, maps rows to the `Provider` type. Query key: `['providers']`.
- **useCreateProvider()** -- INSERT mutation, invalidates `['providers']`, shows toast "Provider added".
- **useUpdateProvider()** -- UPDATE mutation, invalidates `['providers']`, shows toast "Provider updated".
- **useDeleteProvider()** -- DELETE mutation, invalidates `['providers']`, shows toast "Provider deleted".
- Reuse `useAssetCategories()` from `useAssets.ts` for the category dropdown (no rename needed -- it queries the same `categories` table).

### 3. `src/components/providers/ProviderCard.tsx`
Card component for the list view. Shows:
- Provider name (bold)
- Phone with Phone icon (if present, muted text)
- Email with Mail icon (if present, muted text)
- ChevronRight icon on the right
- Same button/card styling as AssetCard

### 4. `src/components/providers/ProviderForm.tsx`
Form component used inside a Sheet, same pattern as AssetForm. Fields:
- Name (text input, required)
- Category (Select dropdown using `useAssetCategories()`, optional)
- Phone (text input)
- Email (text input, type="email")
- Address (textarea, 2 rows)
- Website (text input, type="url")
- Notes (textarea, 3 rows)
- Save / Cancel buttons

### 5. `src/pages/Providers.tsx`
Main page with list/detail view states (same `useState<'list' | 'detail'>` pattern as Assets.tsx):

**List View:**
- "Providers" heading, "Add Provider" button
- Groups by category with DynamicIcon section headers (reuse the same DynamicIcon helper)
- ProviderCard for each item
- Empty state with Wrench icon

**Detail View:**
- Back arrow, provider name heading
- Category badge with color
- Contact fields shown with icons, only if they have values:
  - Phone (Phone icon) -- wrapped in `<a href="tel:...">` link
  - Email (Mail icon) -- wrapped in `<a href="mailto:...">` link
  - Address (MapPin icon) -- plain text
  - Website (Globe icon) -- wrapped in `<a href="..." target="_blank">` link
  - Notes -- plain text with whitespace-pre-wrap
- Edit (Pencil) and Delete (Trash2) buttons in top right
- Delete confirmation via AlertDialog ("Are you sure you want to delete this provider?")
- Sheet for editing from detail view
- Support `?edit=id` deep-link parameter (same pattern as Assets)

## Modified Files

### 6. `src/components/layout/AppSidebar.tsx`
- Add `Wrench` to the lucide-react import
- Add nav item: `{ title: 'Providers', url: '/providers', icon: Wrench }` after Assets

### 7. `src/App.tsx`
- Import `Providers` page component
- Add route: `<Route path="/providers" element={<Providers />} />`

## Technical Details

| Detail | Description |
|--------|-------------|
| Tables used | `service_providers` joined with `categories` |
| Category hook | Reuses `useAssetCategories()` from `useAssets.ts` |
| Query key | `['providers']` |
| Dynamic icons | Same `DynamicIcon` helper as Assets page |
| Contact links | `tel:` for phone, `mailto:` for email, external link for website |
| View management | Single page with `useState<'list' \| 'detail'>` |
| Deep-link edit | `?edit=id` URL parameter support |
| Delete confirmation | AlertDialog component |
