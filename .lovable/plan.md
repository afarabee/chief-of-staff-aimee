

# Clickable Item Links in AI Chat Responses

## Approach

Two-part solution: (1) have the AI embed special link markers in its replies when referencing items, and (2) parse those markers in the frontend to render clickable links that navigate to the item or a filtered view.

## How it works

```text
User asks: "Show me my high priority tasks"
         ↓
Gemini system prompt instructs: use [[task:uuid|Title]] syntax
         ↓
AI reply: "You have 3 high priority tasks: [[task:abc|Fix roof]], [[task:def|Call plumber]], [[task:ghi|Review budget]]"
         ↓
Frontend parses [[type:id|label]] markers
         ↓
Renders as clickable chips/links in chat
         ↓
Single item click → /tasks?edit=abc
Multiple items → "View all on Tasks page" button → /tasks?ids=abc,def,ghi
```

## Changes

### `supabase/functions/chat/index.ts`
- Add to system prompt: instruct Gemini to wrap referenced items with `[[type:id|Display Name]]` syntax (type = `task`, `idea`, `provider`, `asset`)
- Example instruction: "When listing or mentioning specific items from the context data, wrap each one with `[[type:id|Name]]` — e.g. `[[task:abc-123|Fix the roof]]`. This enables clickable navigation."

### `src/components/chat/AIChatBot.tsx`
- Update `renderMarkdown` to detect `[[type:id|label]]` patterns and convert them to clickable `<a>` tags with `data-item-type` and `data-item-id` attributes
- After rendering, also extract all referenced items from the message to show a "View all N items" button when 2+ items of the same type are referenced
- Add click handler on the chat content area (event delegation) that intercepts these link clicks, calls `navigate()` to the appropriate page with `?edit=id` for single items
- Add a "View all" button component that navigates to `/tasks?ids=id1,id2,id3` (or `/ideas?ids=...`, `/providers?ids=...`)
- Close the chat panel on navigation

### `src/pages/Tasks.tsx`
- Read `ids` from search params
- If present, filter `filteredTasks` to only tasks whose ID is in the comma-separated list
- Show a "Clear filter" button to remove the `ids` param
- Clear `ids` param when user manually changes filters

### `src/pages/Ideas.tsx`
- Same `ids` param support as Tasks

### `src/pages/Providers.tsx`
- Same `ids` param support as Providers

## Files

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add link syntax instruction to system prompt |
| `src/components/chat/AIChatBot.tsx` | Parse `[[type:id\|label]]` into clickable links + "View all" button |
| `src/pages/Tasks.tsx` | Support `?ids=` filter param |
| `src/pages/Ideas.tsx` | Support `?ids=` filter param |
| `src/pages/Providers.tsx` | Support `?ids=` filter param |

