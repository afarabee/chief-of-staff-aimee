


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

## Files

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Added link syntax instruction to system prompt |
| `src/components/chat/AIChatBot.tsx` | Parse `[[type:id|label]]` into clickable links + "View all" button |
| `src/pages/Tasks.tsx` | Support `?ids=` filter param |
| `src/pages/Ideas.tsx` | Support `?ids=` filter param |
| `src/pages/Providers.tsx` | Support `?ids=` filter param |
