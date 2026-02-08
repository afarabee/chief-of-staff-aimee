

# Plan: Add Function Calling to AI Chatbot

## Overview
Upgrade the chat Edge Function to use Gemini's function calling feature, allowing the AI to create and update records (tasks, ideas, maintenance tasks, assets, providers) directly from natural language commands.

## Changes

### 1. Edge Function (`supabase/functions/chat/index.ts`) -- Major rewrite

**Add Supabase client initialization:**
- Import `createClient` from `@supabase/supabase-js` (Deno CDN)
- Initialize with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env

**Add Gemini tool declarations:**
- Define 8 function declarations: `create_task`, `update_task`, `create_idea`, `update_idea`, `create_maintenance_task`, `update_maintenance_task`, `create_asset`, `create_provider`
- Each with typed parameters matching the database schema
- Pass as `tools` array in the Gemini API request

**Add function execution handlers:**
- A `executeFunctionCall(name, args, supabaseClient)` function that routes to the correct table operation
- `create_task`: INSERT into `cos_tasks` (defaults: status=backlog, priority=low)
- `update_task`: UPDATE `cos_tasks` by id
- `create_idea`: INSERT into `cos_ideas` (default: status=new)
- `update_idea`: UPDATE `cos_ideas` by id
- `create_maintenance_task`: INSERT into `tasks` (default: status=pending)
- `update_maintenance_task`: UPDATE `tasks` by id; if status=completed, auto-set date_completed to today
- `create_asset`: INSERT into `assets`
- `create_provider`: INSERT into `service_providers`
- Each returns `{ success, record }` or `{ success: false, error }`

**Handle the function-calling loop:**
- After initial Gemini call, check if response contains `functionCall` in parts
- If yes: execute the DB operation, then send a follow-up request to Gemini with the function result so it generates a natural confirmation message
- If no: return text response as before
- Return `{ reply, mutated: true/false }` so the frontend knows to refresh

**Update context section builders:**
- Include `id` fields in all data sections (assets, tasks, ideas, maintenance, providers) so the AI can reference them for updates
- Add a categories section with IDs so the AI can assign categories when creating assets/providers

**Update system prompt:**
- Add instructions about creating/updating records via function calls
- Include default category ID for tasks/ideas
- Tell the AI to confirm actions and ask for clarification when ambiguous

### 2. Frontend (`src/components/chat/AIChatBot.tsx`)

**Update `fetchChatContext`:**
- Include `id` in all mapped objects (assets, tasks, ideas, maintenance tasks, providers)
- Fetch `categories` table (id, name, icon) and add to context
- Fetch `cos_categories` table (id, name) and add to context as `cos_categories`

**Update `ChatContext` interface:**
- Add `categories` and `cos_categories` arrays

**Handle mutations in `sendMessage`:**
- After receiving response, check `data.mutated` flag
- If true: re-fetch context (`contextRef.current = await fetchChatContext()`) and invalidate TanStack Query caches using `queryClient.invalidateQueries` for keys: `tasks`, `ideas`, `assets`, `providers`, `maintenance-tasks`, `categories`
- Import `useQueryClient` from TanStack Query for cache invalidation

### 3. No database or config changes needed
- RLS policies already allow all access (single-user app)
- Edge function config unchanged

## Technical Notes
- The Gemini function-calling loop may involve 2 API calls per mutation request (initial call returning functionCall, then follow-up with result for natural language confirmation)
- The Edge Function uses the service role key to bypass RLS for writes, ensuring reliability
- Error handling: if a DB operation fails, the error message is sent back to Gemini as the function result so it can explain the failure naturally
- Context refresh after mutations ensures follow-up questions reflect the latest state
