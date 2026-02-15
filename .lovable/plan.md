

# Link Assets and Providers Directly

## Overview
Create a direct many-to-many relationship between Assets and Service Providers, so you can associate a provider with an asset (and vice versa) without needing to create a reminder first.

## Database Change
Create a new junction table `asset_providers` with:
- `id` (uuid, primary key)
- `asset_id` (uuid, references assets)
- `provider_id` (uuid, references service_providers)
- `created_at` (timestamp)
- A unique constraint on (asset_id, provider_id) to prevent duplicates
- RLS policy allowing all access (matching existing tables)

## UI Changes

### Asset Detail View (Assets.tsx)
- Add a "Providers" section above the Tasks section
- Shows linked providers as clickable chips/cards with the provider name
- "Link Provider" button opens a dropdown/select to pick from existing providers
- Each linked provider has an "unlink" (X) button to remove the association
- Clicking a provider name navigates to that provider's detail view

### Provider Detail View (Providers.tsx)
- Add an "Assets" section above the Reminders section
- Shows linked assets as clickable chips/cards with the asset name
- "Link Asset" button opens a dropdown/select to pick from existing assets
- Each linked asset has an "unlink" (X) button
- Clicking an asset name navigates to that asset's detail view

## New Hooks (src/hooks/useAssetProviders.ts)
- `useAssetProviders(assetId)` -- fetch providers linked to an asset
- `useProviderAssets(providerId)` -- fetch assets linked to a provider
- `useLinkAssetProvider()` -- insert into asset_providers
- `useUnlinkAssetProvider()` -- delete from asset_providers

## Technical Details

### New file: `src/hooks/useAssetProviders.ts`
Contains all four hooks above. Queries join through the junction table to return full provider/asset names. Invalidates both `asset-providers` and `provider-assets` query keys on mutations.

### Modified files:
1. **`src/pages/Assets.tsx`** -- Add a `LinkedProvidersSection` component in the detail view showing linked providers with link/unlink controls
2. **`src/pages/Providers.tsx`** -- Add a `LinkedAssetsSection` component in the detail view showing linked assets with link/unlink controls

### Migration SQL:
```sql
CREATE TABLE asset_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, provider_id)
);

ALTER TABLE asset_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to asset_providers" ON asset_providers
  FOR ALL USING (true) WITH CHECK (true);
```

