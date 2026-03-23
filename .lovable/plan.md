

# Verify News Article URLs Before Returning Them

## Problem
The Gemini grounding URLs look real but 2 out of 5 led to dead pages. The edge function currently trusts whatever URL it gets without checking if the page actually exists.

## Solution
Add a server-side URL verification step in the edge function. After collecting articles with URLs, do a `HEAD` request (with timeout) to each URL. If the response is not a 2xx status, set `url` to `null` so the frontend falls back to DuckDuckGo search instead of sending the user to a broken page.

## Changes

### `supabase/functions/ai-news/index.ts`

After the existing URL sanitization step, add a verification pass:

- For each article with a non-null `url`, send a `HEAD` request with a 5-second timeout using `AbortSignal.timeout(5000)`
- If the response status is 2xx or 3xx, keep the URL
- If it returns 4xx/5xx, times out, or throws an error, set `url` to `null`
- Run all verifications in parallel with `Promise.all` so it doesn't add significant latency
- Log which URLs passed/failed for debugging

No frontend changes needed — the widget already handles `url: null` by falling back to DuckDuckGo search with the "Search" label.

## Technical Detail

```text
Gemini returns articles with URLs
        ↓
Existing: sanitize blocked Google hosts
        ↓
NEW: HEAD request each URL (5s timeout, parallel)
        ↓
Keep URL if 2xx/3xx, null if 4xx/5xx/timeout
        ↓
Return to frontend
```

This adds ~1-3 seconds of latency (parallel, capped at 5s) but guarantees every "Read" link opens a real page.

