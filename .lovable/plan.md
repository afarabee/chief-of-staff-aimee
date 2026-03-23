
Fix goal: stop Top AI News links from ever sending users to Google-hosted URLs that trigger `ERR_BLOCKED_BY_RESPONSE` in preview.

What I found
- `src/components/command-center/NewsWidget.tsx` still falls back to `https://www.google.com/search?...` when `article.url` is missing.
- `supabase/functions/ai-news/index.ts` is currently returning Gemini grounding redirect URLs like `https://vertexaisearch.cloud.google.com/grounding-api-redirect/...` (confirmed in network logs), which are also Google-hosted.
- Those two paths explain why the issue keeps recurring.

Implementation plan

1) Harden URL generation in `supabase/functions/ai-news/index.ts`
- Add URL sanitization + normalization logic before returning articles.
- For each candidate URL:
  - Parse and detect blocked hosts (`google.com`, `*.google.com`, `*.googleusercontent.com`, `vertexaisearch.cloud.google.com`).
  - If it is a Google/grounding redirect URL, resolve it server-side by following redirects (`fetch` with redirect follow) and capture the final destination URL.
  - Keep only final URLs that are valid `http/https` and non-Google.
- If a safe direct URL cannot be resolved, return `url: null` (instead of returning a Google URL).
- Keep response shape unchanged: `{ articles: [{ title, source, snippet, url }] }`.

2) Remove Google fallback from `src/components/command-center/NewsWidget.tsx`
- Replace fallback from Google Search to a non-Google search URL (DuckDuckGo or Bing; defaulting to DuckDuckGo).
- Keep full-row click behavior.
- Label logic:
  - `Read` when `article.url` exists (direct article link).
  - `Search` when fallback search URL is used.
- This guarantees no News click path uses `www.google.com`.

3) Add a defensive guard in the UI click target
- Build `targetUrl` from:
  - safe article URL (if present), else
  - non-Google search fallback.
- Ensure the widget never passes a Google URL into `openExternalUrl`.

Validation plan
- Call `ai-news` edge function and confirm returned `articles[].url` contains no Google/vertex URLs.
- In Command Center, click multiple news rows:
  - No `ERR_BLOCKED_BY_RESPONSE` page.
  - Links open externally (or clipboard fallback toast appears with a non-Google URL if popup is blocked).
- Confirm current behavior remains unchanged for Calendar/Podcasts links.

Files to update
- `supabase/functions/ai-news/index.ts`
- `src/components/command-center/NewsWidget.tsx`
