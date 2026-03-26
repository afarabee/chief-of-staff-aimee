

# Add Keyword Search Filter to Tasks, Ideas, and Providers

## Changes

### `src/pages/Tasks.tsx`
- Add `keywordFilter` state (string, default `''`)
- Add a debounced `Input` field in the filter bar (next to priority Select) with placeholder "Search tasks..."
- Apply keyword filter in `filteredTasks` memo: match against `title` and `description` (case-insensitive)
- Use a 300ms debounce via a `debouncedKeyword` state updated in a `useEffect` with `setTimeout`

### `src/pages/Ideas.tsx`
- Add `keywordFilter` state + same debounce pattern
- Add `Input` in the filter bar next to status Select, placeholder "Search ideas..."
- Apply keyword filter in `filteredIdeas` memo before status filter

### `src/pages/Providers.tsx`
- Add `keywordFilter` state + same debounce pattern
- Add `Input` above the provider groups (in list view only), placeholder "Search providers..."
- Filter `providers` array by `name` and `notes` before grouping

### Implementation detail
Each page gets its own local debounce (no shared hook needed — it's 4 lines):
```
const [keyword, setKeyword] = useState('');
const [debouncedKeyword, setDebouncedKeyword] = useState('');
useEffect(() => {
  const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
  return () => clearTimeout(t);
}, [keyword]);
```
The `Input` uses `Search` icon from lucide as a visual hint, placed in the filter row.

| File | Change |
|------|--------|
| `src/pages/Tasks.tsx` | Add keyword search input + debounced filter |
| `src/pages/Ideas.tsx` | Add keyword search input + debounced filter |
| `src/pages/Providers.tsx` | Add keyword search input + debounced filter |

