

# Actionable AI Suggestions -- Interactive Suggestion Cards

## Overview
Upgrade the "Enrich with AI" feature so each suggestion becomes an interactive card with three action buttons: Execute (run the suggestion via Gemini), Chat (pre-fill the chatbot), and Create Subtask (create a cos_tasks entry). Suggestions change from plain text to a JSON array, and executed results are stored inline.

## What You'll See
- Each AI suggestion rendered as its own card/row with the suggestion text and three icon buttons
- **Execute** (Zap icon): Calls Gemini to perform the suggestion, shows the result in a collapsible section below
- **Chat** (MessageSquare icon): Opens the floating chatbot and pre-fills the input with the suggestion in context
- **Create Subtask** (ListPlus icon): Creates a new task in cos_tasks from the suggestion
- Executed results show in a collapsible area with markdown-like formatting and a copy button
- Old plain-text suggestions are automatically converted to the new JSON format on display

## Technical Details

### 1. Update `enrich-item` Edge Function
**File:** `supabase/functions/enrich-item/index.ts`

- Change the Gemini prompt to request a JSON array response format: `[{ "suggestion": "..." }, ...]`
- After receiving Gemini's response, strip any markdown code fences (` ```json ... ``` `) and parse as JSON
- If JSON parsing fails, fall back to splitting by numbered lines and wrapping each in `{ "suggestion": "..." }`
- Save the JSON string (via `JSON.stringify`) to `ai_suggestions`
- Return `{ suggestions: theJsonArray }` instead of plain text

### 2. Create `execute-suggestion` Edge Function
**File:** `supabase/functions/execute-suggestion/index.ts`

- Accepts POST: `{ suggestion, item_type, item_title, item_description, item_id, suggestion_index }`
- Builds a Gemini prompt asking it to thoroughly execute the suggestion in context of the item
- Calls Gemini 2.0 Flash, gets the result
- Reads the current `ai_suggestions` JSON from the appropriate table, parses it, sets `result` on the matching suggestion index, writes it back
- Returns `{ result: "..." }`

### 3. Update `supabase/config.toml`
Add:
```
[functions.execute-suggestion]
verify_jwt = false
```

### 4. Create helper: `src/lib/parseSuggestions.ts`
- Export `parseSuggestions(raw: string | null): Array<{ suggestion: string; result?: string | null }>`
- Try `JSON.parse(raw)`. If it returns an array of objects with `suggestion` fields, return it
- Otherwise, treat as plain text: split by lines matching `/^\d+\.\s/`, wrap each in `{ suggestion: text }`
- Handles null/empty gracefully (returns empty array)

### 5. Create hook: `src/hooks/useExecuteSuggestion.ts`
- `useMutation` that calls `supabase.functions.invoke('execute-suggestion', { body })`
- On success: invalidates tasks/ideas/maintenance-tasks queries
- Returns the result text

### 6. Create hook: `src/hooks/useCreateSubtask.ts`
- `useMutation` that inserts into `cos_tasks` via Supabase client:
  - `title`: suggestion text truncated to 80 chars
  - `description`: "Subtask created from AI suggestion for: [parent title]\n\nFull suggestion: [text]\n\nCreated by AI Enrichment"
  - `status`: "Backlog" (matching DB default casing)
  - `priority`: "Low"
  - `category_id`: parent's category_id or null
- Invalidates `tasks` query, shows toast

### 7. Major rewrite: `src/components/ai/EnrichWithAI.tsx`
Replace the plain text display with interactive suggestion cards:

- Parse `existingSuggestions` and local suggestions using `parseSuggestions()`
- Each suggestion renders as a row with:
  - Suggestion text (left, taking most width)
  - Three icon buttons (right):
    - **Execute** (Zap): calls `useExecuteSuggestion`, shows spinner on that row only, stores result; once done, shows checkmark, disabled
    - **Chat** (MessageSquare): opens the chatbot and pre-fills input (see Step 8)
    - **Create Subtask** (ListPlus): calls `useCreateSubtask`, shows toast, becomes checkmark when done
- When a suggestion has a `result`:
  - Show a Collapsible below with "Show result" / "Hide result" toggle
  - Render result with basic markdown formatting (bold, bullets, headers)
  - Include a Copy button (clipboard icon) in the result header
- Use `Tooltip` on each button for labels
- Track per-suggestion state (executing index, created subtask indices) in local component state

### 8. Chat pre-fill mechanism
- The `AIChatBot` component manages its own `input` state
- Add a simple event-based approach: create a custom event `'prefill-chat'` that carries the text
- In `EnrichWithAI`, when Chat is clicked:
  - Dispatch `window.dispatchEvent(new CustomEvent('prefill-chat', { detail: { text } }))`
  - The text format: `For my [task/idea/reminder] titled '[item title]': [suggestion text]`
- In `AIChatBot`, add a `useEffect` listener for `'prefill-chat'` events:
  - Set `input` to the event detail text
  - Set `open` to true
  - Focus the input

### 9. Update `useEnrichItem.ts`
- Change return type to handle JSON array (the edge function now returns an array)
- The mutation return value should be the JSON string for local state

### 10. Update parent forms (minor)
- `TaskForm`, `IdeaForm`, `MaintenanceTaskForm`: pass `itemTitle` as a new prop to `EnrichWithAI` (needed for chat pre-fill and subtask description)
- Pass `categoryId` for subtask creation

### Files Created
- `supabase/functions/execute-suggestion/index.ts`
- `src/lib/parseSuggestions.ts`
- `src/hooks/useExecuteSuggestion.ts`
- `src/hooks/useCreateSubtask.ts`

### Files Modified
- `supabase/functions/enrich-item/index.ts` -- JSON format prompt + parsing
- `supabase/config.toml` -- add execute-suggestion
- `src/components/ai/EnrichWithAI.tsx` -- full rewrite with interactive cards
- `src/components/chat/AIChatBot.tsx` -- add prefill-chat event listener
- `src/hooks/useEnrichItem.ts` -- handle JSON return type
- `src/components/tasks/TaskForm.tsx` -- pass itemTitle and categoryId props
- `src/components/ideas/IdeaForm.tsx` -- pass itemTitle and categoryId props
- `src/components/maintenance/MaintenanceTaskForm.tsx` -- pass itemTitle prop

