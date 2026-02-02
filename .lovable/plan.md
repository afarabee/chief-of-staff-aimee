
# Plan: Category Detail View

## Overview
Create a new page at `/category/:categoryId` that displays a category's icon and name as a header, along with all non-done Tasks and Ideas in that category. Items will be clickable to open edit dialogs.

## Implementation Steps

### 1. Create the Category Detail Page
**File:** `src/pages/CategoryDetail.tsx`

Create a new page component that:
- Uses `useParams()` to get the `categoryId` from the URL
- Fetches the category using `useCategories()` and finds by ID
- Uses `useApp()` to get all tasks and ideas
- Filters tasks where `categoryId` matches AND `status !== 'done'`
- Filters ideas where `categoryId` matches AND `status !== 'done'`
- Displays two sections: "Tasks" and "Ideas"
- Uses existing `TaskCard` and `IdeaCard` components
- Includes edit dialogs (same pattern as Tasks.tsx and Ideas.tsx)

Page structure:
```text
+------------------------------------------+
| [Back] Category Icon + Name              |
+------------------------------------------+
| Tasks (count)                            |
| +----------+ +----------+ +----------+   |
| | TaskCard | | TaskCard | | TaskCard |   |
| +----------+ +----------+ +----------+   |
+------------------------------------------+
| Ideas (count)                            |
| +----------+ +----------+ +----------+   |
| | IdeaCard | | IdeaCard | | IdeaCard |   |
| +----------+ +----------+ +----------+   |
+------------------------------------------+
```

### 2. Add Route to App.tsx
**File:** `src/App.tsx`

Add import and route:
```tsx
import CategoryDetail from "./pages/CategoryDetail";

// In Routes:
<Route path="/category/:categoryId" element={<CategoryDetail />} />
```

### 3. Make Category Clickable on Categories Page
**File:** `src/pages/Categories.tsx`

Wrap category rows in a link/navigation to `/category/:categoryId`:
- Use `useNavigate()` from react-router-dom
- Add click handler to navigate to category detail

### 4. Make Category Badges Clickable
**Files:** 
- `src/components/tasks/TaskCard.tsx`
- `src/components/ideas/IdeaCard.tsx`

Wrap category badges with a clickable element that navigates to `/category/:categoryId`:
- Use `Link` from react-router-dom or `onClick` with `useNavigate()`
- Prevent event propagation to avoid triggering the card click

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/pages/CategoryDetail.tsx` | Create | New page component |
| `src/App.tsx` | Modify | Add route for `/category/:categoryId` |
| `src/pages/Categories.tsx` | Modify | Make category rows clickable |
| `src/components/tasks/TaskCard.tsx` | Modify | Make category badge clickable |
| `src/components/ideas/IdeaCard.tsx` | Modify | Make category badge clickable |

## Technical Details

### CategoryDetail.tsx Structure
```tsx
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/useCategories';
import { Task, Idea } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { Button } from '@/components/ui/button';
import { Dialog, ... } from '@/components/ui/dialog';

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { tasks, ideas, isLoading } = useApp();
  const { data: categories = [] } = useCategories();
  
  // State for edit dialogs
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);
  
  // Find current category
  const category = categories.find(c => c.id === categoryId);
  
  // Filter tasks and ideas (exclude "done" status)
  const categoryTasks = useMemo(() => 
    tasks.filter(t => t.categoryId === categoryId && t.status !== 'done'),
    [tasks, categoryId]
  );
  
  const categoryIdeas = useMemo(() => 
    ideas.filter(i => i.categoryId === categoryId && i.status !== 'done'),
    [ideas, categoryId]
  );
  
  // Render header with back button, icon, and name
  // Render Tasks section with grid of TaskCards
  // Render Ideas section with grid of IdeaCards
  // Include edit dialogs
}
```

### Clickable Category Badge Pattern
```tsx
// In TaskCard.tsx and IdeaCard.tsx
import { useNavigate } from 'react-router-dom';

// In component:
const navigate = useNavigate();

const handleCategoryClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent card click
  if (category) {
    navigate(`/category/${category.id}`);
  }
};

// In JSX:
{category && (
  <Badge 
    variant="secondary" 
    className="text-xs cursor-pointer hover:bg-secondary/80"
    onClick={handleCategoryClick}
  >
    {category.icon && <span className="mr-1">{category.icon}</span>}
    {category.name}
  </Badge>
)}
```

## Edge Cases Handled
- **Invalid category ID**: Show "Category not found" message with back button
- **Empty sections**: Show helpful empty state messages
- **Loading state**: Show skeleton placeholders
- **No items in category**: Show message indicating no active tasks/ideas
