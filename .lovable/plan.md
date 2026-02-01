

# Bold Visual Polish for Chief of Staff

This plan pushes the design further with a truly dark sidebar, stronger section colors, and polished card styling that creates a professional, intentional aesthetic.

## Overview

The changes will transform the current washed-out look into a bold, visually distinct interface with:
- Deep slate-900 sidebar with light text
- Strongly tinted dashboard sections with visible backgrounds
- Status-colored Kanban column headers
- Task/idea cards with colored left border stripes
- Enhanced shadows and visual depth

## 1. Dark Sidebar Theme

Update CSS variables in `src/index.css` to create a truly dark sidebar:

| Variable | Current | New |
|----------|---------|-----|
| `--sidebar-background` | Light gray `0 0% 98%` | Deep slate `222 47% 11%` (#1e293b) |
| `--sidebar-foreground` | Dark text | Light text `210 40% 98%` |
| `--sidebar-border` | Light | Dark slate `217 33% 17%` |
| `--sidebar-accent` | Light | Slate hover `217 33% 20%` |
| `--sidebar-accent-foreground` | Dark | Light `210 40% 98%` |

Keep the pink highlight on active items for the Orchid theme accent.

## 2. Today Dashboard Section Colors

Update `src/pages/Index.tsx` to wrap each section card with a visible background tint:

| Section | Background | Border Accent |
|---------|------------|---------------|
| Overdue | `bg-red-100 dark:bg-red-950/30` | `border-red-200` |
| Due Today | `bg-sky-100 dark:bg-sky-950/30` | `border-sky-200` |
| Ideas in Progress | `bg-amber-100 dark:bg-amber-950/30` | `border-amber-200` |

Add `shadow-md` to all section cards and increase spacing with `gap-8`.

## 3. Kanban Column Styling

Update `src/components/tasks/KanbanColumn.tsx` with bold column header colors:

| Status | Header Background | Header Text |
|--------|------------------|-------------|
| Backlog | `bg-slate-200 dark:bg-slate-700` | Slate text |
| To-Do | `bg-sky-200 dark:bg-sky-800` | Sky text |
| In Progress | `bg-violet-200 dark:bg-violet-800` | Violet text |
| Blocked | `bg-orange-200 dark:bg-orange-800` | Orange text |
| Done | `bg-emerald-200 dark:bg-emerald-800` | Emerald text |

Add a subtle matching tint to column bodies.

## 4. Status-Colored Card Borders

Add a 4px left border stripe to cards based on status:

**TaskCard.tsx** - Left border color by task status:
```text
backlog     -> border-l-slate-400
to-do       -> border-l-sky-500
in-progress -> border-l-violet-500
blocked     -> border-l-orange-500
done        -> border-l-emerald-500
```

**IdeaCard.tsx** - Left border color by idea status:
```text
new         -> border-l-pink-500 (primary Orchid)
in-progress -> border-l-violet-500
parked      -> border-l-slate-400
done        -> border-l-emerald-500
```

Apply `border-l-4` class to both card types.

## 5. Enhanced Card Shadows

Update card styling for more depth:
- Base cards: `shadow-md hover:shadow-lg transition-shadow`
- Dashboard section cards: `shadow-md`
- Kanban dragging state: Keep existing `shadow-lg`

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update sidebar CSS variables for dark theme |
| `src/components/layout/AppLayout.tsx` | Increase content padding to `p-8` |
| `src/pages/Index.tsx` | Add section background colors, shadows, increase spacing |
| `src/components/tasks/TaskCard.tsx` | Add status-colored left border, shadow |
| `src/components/ideas/IdeaCard.tsx` | Add status-colored left border, shadow |
| `src/components/tasks/KanbanColumn.tsx` | Update header colors to bold status tints |
| `src/components/ui/card.tsx` | Update default shadow to `shadow-md` |

## Technical Details

### Sidebar CSS Variables (Light Mode)

```css
--sidebar-background: 222 47% 11%;
--sidebar-foreground: 210 40% 98%;
--sidebar-primary: 333 71% 50%;
--sidebar-primary-foreground: 327 73% 97%;
--sidebar-accent: 217 33% 20%;
--sidebar-accent-foreground: 210 40% 98%;
--sidebar-border: 217 33% 17%;
```

### Status Border Classes

TaskCard will include:
```typescript
const statusBorderColors: Record<string, string> = {
  backlog: 'border-l-slate-400',
  'to-do': 'border-l-sky-500',
  'in-progress': 'border-l-violet-500',
  blocked: 'border-l-orange-500',
  done: 'border-l-emerald-500',
};
```

Applied as `border-l-4 ${statusBorderColors[task.status]}` on the card container.

### Kanban Column Config

```typescript
const statusConfig: Record<TaskStatus, { label: string; headerBg: string; bodyBg: string }> = {
  backlog: { 
    label: 'Backlog', 
    headerBg: 'bg-slate-200 dark:bg-slate-700', 
    bodyBg: 'bg-slate-50 dark:bg-slate-800/30' 
  },
  'to-do': { 
    label: 'To-Do', 
    headerBg: 'bg-sky-200 dark:bg-sky-800', 
    bodyBg: 'bg-sky-50 dark:bg-sky-900/20' 
  },
  'in-progress': { 
    label: 'In Progress', 
    headerBg: 'bg-violet-200 dark:bg-violet-800', 
    bodyBg: 'bg-violet-50 dark:bg-violet-900/20' 
  },
  blocked: { 
    label: 'Blocked', 
    headerBg: 'bg-orange-200 dark:bg-orange-800', 
    bodyBg: 'bg-orange-50 dark:bg-orange-900/20' 
  },
  done: { 
    label: 'Done', 
    headerBg: 'bg-emerald-200 dark:bg-emerald-800', 
    bodyBg: 'bg-emerald-50 dark:bg-emerald-900/20' 
  },
};
```

## Visual Result

After these changes:
- Sidebar will be deep slate with white text and pink active highlights
- Dashboard sections will have clearly visible color-coded backgrounds
- Kanban columns will have bold, status-meaningful header colors
- Every task/idea card will have a colored left stripe indicating status
- Overall increased contrast between sidebar and content area
- Professional, polished appearance that feels intentional

