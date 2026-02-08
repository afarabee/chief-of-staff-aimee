

# Plan: Floating AI Chatbot (Gemini-Powered)

## Overview
Add a floating AI assistant that helps with home maintenance, asset care, and life management. It knows about the user's assets from the database and maintains conversation context within the session.

## Prerequisites
The `GEMINI_API_KEY` secret is already configured in Supabase, so no additional setup is needed.

## Changes

### 1. Edge Function: `supabase/functions/chat/index.ts`
- Accepts POST with `{ message, assets, history }`
- Builds a system prompt listing the user's assets (name, category, description, purchase date)
- Calls Gemini 2.0 Flash API using the stored secret
- Returns `{ reply }` or `{ error }` on failure
- Includes CORS headers and OPTIONS handler
- Good logging for debugging

### 2. Update `supabase/config.toml`
- Add `[functions.chat]` with `verify_jwt = false` (single-user app, no auth needed)

### 3. New Component: `src/components/chat/AIChatBot.tsx`
The main floating chat component containing all chat logic:

- **Floating button**: Fixed bottom-right (24px inset), 56px circle, primary background, MessageCircle icon (toggles to X when open), shadow, hover scale animation
- **Chat panel**: 380px wide, 500px tall, positioned above the button. On mobile (< 640px), goes full-screen. Uses Card, Button, ScrollArea from shadcn/ui
- **Header**: "AI Assistant" title, Clear button, close X button
- **Message area**: Chat bubbles (user = right/primary, AI = left/muted), markdown rendering for AI responses, auto-scroll, typing indicator (animated dots), welcome message on first open
- **Input area**: Text input + send button (SendHorizontal icon), Enter to send, Shift+Enter for newline, disabled while loading

### 4. State and Data Flow
- Messages stored in React state (session only, not persisted)
- Assets fetched once via `useAssets()` hook when panel opens
- Last 10 messages sent as history with each request
- Chat API called via `supabase.functions.invoke('chat', { body })` -- not a TanStack query, just async state management
- z-index set high enough to float above all content (z-50 or higher)

### 5. Update `src/components/layout/AppLayout.tsx`
- Import and render `<AIChatBot />` at the end of the layout, so it appears on every page

### 6. Markdown Rendering
- AI responses will be rendered using a simple approach: parse bold, lists, and code blocks using basic HTML/regex or a lightweight inline renderer, to avoid adding a new dependency

## Technical Notes
- The component is self-contained and does not interfere with existing app functionality
- No database changes required -- assets are read-only from the existing `assets` table
- No new dependencies needed -- uses existing shadcn/ui components, lucide icons, and the Supabase client
- The edge function is public (no JWT) since this is a single-user personal tool

