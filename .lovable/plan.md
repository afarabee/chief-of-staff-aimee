

# Fix News Article Links

## Problem
The Gemini model generating news articles produces URLs that are hallucinated — they look real but don't point to actual pages. LLMs don't browse the web, so any URL they return is unreliable.

## Solution
Instead of trusting AI-generated URLs, construct a **Google Search link** from each article's title and source. This guarantees the user lands on a real search results page where the actual article will be the top result.

## Changes

### 1. Edge Function: `supabase/functions/ai-news/index.ts`
- Remove the `url` field from the tool schema entirely (stop asking the model to hallucinate URLs)
- Keep title, source, and snippet

### 2. Frontend: `src/components/command-center/NewsWidget.tsx`
- Instead of using `article.url`, construct a Google Search URL: `https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + article.source)}`
- Every article becomes clickable (no need for the `hasUrl` conditional)
- Change the "Read" label to "Search" with the ExternalLink icon

### 3. Hook: `src/hooks/useAiNews.ts`
- Remove `url` from the `NewsArticle` interface (optional)

This is a small, reliable fix — every link will work and take the user to the real article via search.

