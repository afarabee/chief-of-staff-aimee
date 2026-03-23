

# Fix: Make AI News Pull Real, Current Headlines

## Problem
The edge function asks an LLM to generate news from memory. LLMs don't browse the web — they return the same hallucinated/stale headlines every time.

## Solution
Use the **Gemini API directly** with **Google Search grounding** enabled. This tells Gemini to actually search Google for current news before responding, returning real headlines with source URLs from the grounding metadata.

The `VITE_GEMINI_API_KEY` secret is already configured.

## Changes

### 1. Edge Function: `supabase/functions/ai-news/index.ts`

Replace the Lovable AI gateway call with a direct Gemini API call using the native REST endpoint:

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
```

- Pass `tools: [{ google_search: {} }]` to enable real-time Google Search grounding
- Prompt: "What are the top 5 AI and technology news stories from today?"
- Parse the response text AND `groundingMetadata.groundingChunks` to extract real source URLs
- Use the structured tool call pattern to get clean article objects, but now grounded in actual search results
- Fall back to Google Search links if direct URLs aren't available from grounding chunks

### 2. Hook: `src/hooks/useAiNews.ts`

- Add optional `url` field back to `NewsArticle` interface (now with real URLs from grounding)

### 3. Widget: `src/components/command-center/NewsWidget.tsx`

- When `article.url` exists, link directly to it instead of the Google Search fallback
- Keep the Google Search fallback for articles without direct URLs

## Technical Detail

The Gemini Google Search grounding feature makes the model search the web in real-time, then synthesize results. The `groundingChunks` in the response metadata contain verified source URLs. This is fundamentally different from asking an LLM to "remember" news — it actually searches Google.

## File Changes

| File | Change |
|------|--------|
| `supabase/functions/ai-news/index.ts` | Switch to direct Gemini API with Google Search grounding |
| `src/hooks/useAiNews.ts` | Add optional `url` field |
| `src/components/command-center/NewsWidget.tsx` | Prefer real URL over search fallback |

