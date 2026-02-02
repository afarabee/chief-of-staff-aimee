
# Plan: Separate Emoji Icon from Category Name

## Overview
Restructure the `cos_categories` table to store the emoji icon in a separate `icon` column, keeping the `name` field as pure text. This enables proper alphabetical sorting by name while still displaying the icon alongside the name.

## Current State
- Categories store emoji + name together: `"🤖 AI Project"`, `"🏠 Home"`
- Sorting by `name` sorts by emoji Unicode, not alphabetically by text
- 16 categories exist with embedded emojis

## Implementation Steps

### 1. Database Migration
Add an `icon` column to `cos_categories` and migrate existing data:

```sql
-- Add icon column (nullable)
ALTER TABLE cos_categories ADD COLUMN icon text;

-- Migrate existing emoji data: extract first character as icon
-- and update name to be text only
UPDATE cos_categories 
SET 
  icon = LEFT(name, 1),
  name = TRIM(SUBSTRING(name FROM 2));
```

This will transform:
- `name: "🤖 AI Project"` -> `icon: "🤖"`, `name: "AI Project"`
- `name: "🏠 Home"` -> `icon: "🏠"`, `name: "Home"`

### 2. Update TypeScript Types
Modify `src/types/index.ts`:

```typescript
export interface Category {
  id: string;
  name: string;
  icon: string | null;  // Add icon field
  createdAt: Date;
}
```

### 3. Update useCategories Hook
Update `src/hooks/useCategories.ts`:
- Add `icon` to the DbCategory type
- Update create/update mutations to handle `icon` parameter
- Map `icon` field in the conversion function

### 4. Update Categories Page
Modify `src/pages/Categories.tsx`:
- Add separate input field for icon (emoji picker or text input)
- Display icon + name in the list
- Handle icon in create/edit form

### 5. Update Display Components
Update components to show `icon + name`:

**TaskCard.tsx** and **IdeaCard.tsx**:
```tsx
{category && (
  <Badge variant="secondary" className="text-xs">
    {category.icon} {category.name}
  </Badge>
)}
```

**TaskForm.tsx** and **IdeaForm.tsx**:
```tsx
{[...categories]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((cat) => (
    <SelectItem key={cat.id} value={cat.id}>
      {cat.icon} {cat.name}
    </SelectItem>
  ))}
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Add `icon` column, migrate data |
| `src/types/index.ts` | Add `icon` to Category interface |
| `src/hooks/useCategories.ts` | Handle `icon` in CRUD operations |
| `src/pages/Categories.tsx` | Add icon input, display icon + name |
| `src/components/tasks/TaskForm.tsx` | Display `icon + name` in dropdown |
| `src/components/ideas/IdeaForm.tsx` | Display `icon + name` in dropdown |
| `src/components/tasks/TaskCard.tsx` | Display `icon + name` in badge |
| `src/components/ideas/IdeaCard.tsx` | Display `icon + name` in badge |

## Technical Notes
- The database will sort by `name` (pure text), ensuring proper A-Z ordering
- Icon is optional (nullable) - categories can exist without an emoji
- The migration safely handles existing emoji-prefixed names by extracting the first character
