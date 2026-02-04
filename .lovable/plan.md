
# Plan: Add Quick Capture Section to Today Page

## Overview
Add a minimal "Quick Capture" input at the top of the Today page that allows users to quickly jot down an idea with just a title. The idea will be saved with status "New" and no category.

## Implementation

### File to Modify
**`src/pages/Index.tsx`**

### Changes

1. **Add state for the input value**
   - Add a `useState` hook to track the capture input text

2. **Add submit handler**
   - Create a `handleQuickCapture` function that:
     - Validates the input is not empty
     - Calls `addIdea` with the title, empty description, status "new", null categoryId, and null imageUrl
     - Clears the input after saving

3. **Add the Quick Capture UI**
   - Place it after the header section and before the task cards grid
   - Single-line form with:
     - Text input with placeholder "Capture a thought..."
     - Save button (or submit on Enter)
   - Style it to be minimal and unobtrusive

### Code Structure

```tsx
// New state
const [captureText, setCaptureText] = useState('');

// Handler
const handleQuickCapture = () => {
  if (!captureText.trim()) return;
  
  addIdea({
    title: captureText.trim(),
    description: '',
    status: 'new',
    categoryId: null,
    imageUrl: null,
  });
  
  setCaptureText('');
};

// UI (after header, before cards)
<div className="flex gap-2">
  <Input
    placeholder="Capture a thought..."
    value={captureText}
    onChange={(e) => setCaptureText(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
    className="flex-1"
  />
  <Button onClick={handleQuickCapture} disabled={!captureText.trim()}>
    Save
  </Button>
</div>
```

### Additional Imports
- `Input` from `@/components/ui/input`

## Visual Layout

```text
+----------------------------------------------------------+
| [QuickAdd]  Today                                         |
|             Monday, February 3, 2026                     |
+----------------------------------------------------------+
| [ Capture a thought...                          ] [Save] |
+----------------------------------------------------------+
| Overdue Card          |  Due Today Card                  |
| ...                   |  ...                             |
+----------------------------------------------------------+
```

## Summary
| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add captureText state, handleQuickCapture function, and inline form UI |
