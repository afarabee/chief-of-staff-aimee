

# Parse Document to Create Asset (with Review)

## Overview

Add a "Create from Document" button on the Assets list page. The user uploads a receipt/invoice/document, AI extracts asset details, and the **AssetForm opens pre-filled** so the user can review, edit, and confirm before saving.

## Changes

### 1. New Edge Function: `supabase/functions/parse-asset-document/index.ts`

- Accepts `{ file_url: string }` 
- Fetches the file, base64-encodes it, sends to Gemini 2.0 Flash with a prompt to extract: `name`, `description`, `purchase_date`, `notes`, `category_hint`
- Returns structured JSON
- Add to `supabase/config.toml`

### 2. New Hook: `src/hooks/useParseAssetDocument.ts`

- Mutation wrapper around `supabase.functions.invoke('parse-asset-document', ...)`
- Returns `{ mutateAsync, isPending, data }`

### 3. Update `src/components/assets/AssetForm.tsx`

- Add optional `initialValues` prop: `{ name?, description?, purchaseDate?, notes?, categoryHint? }`
- When provided, use these as default state values instead of empty strings
- If `categoryHint` is provided, fuzzy-match against existing categories to auto-select `categoryId`
- Show a subtle banner at the top: "Parsed from document — please review before saving"

### 4. Update `src/pages/Assets.tsx`

- Add a "Scan Document" button (with `FileUp` icon) next to "Add Asset"
- On click: open a hidden file input accepting images, PDFs, Word, Excel
- Upload selected file to Supabase Storage (`attachments` bucket)
- Call `parseAssetDocument` with the public URL
- Store parsed result in state, open `AssetForm` with `initialValues` set from parsed data
- User reviews all fields, edits as needed, then clicks Save — standard creation flow
- The uploaded document URL is stored so it can be auto-attached after asset creation

### User Flow

```text
[Scan Document] → File picker → Upload to Storage → AI parses →
AssetForm opens pre-filled with banner "Parsed from document" →
User reviews/edits → Save → Asset created + document auto-attached
```

No record is created until the user explicitly clicks Save.

