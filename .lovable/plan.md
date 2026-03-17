
Goal: Fix Command Center external links so they reliably open instead of showing `ERR_BLOCKED_BY_RESPONSE` in preview (currently happening with Google URLs).

Why this is happening:
- The News widget currently links to `www.google.com/search?...`.
- In the preview iframe, some external domains (especially Google) can refuse embedded navigation, causing `ERR_BLOCKED_BY_RESPONSE`.
- Even with `target="_blank"`, anchor behavior can still be inconsistent in embedded preview contexts.

Implementation plan:
1. Add a shared external-link opener utility
- Create `src/lib/openExternalUrl.ts` with a small helper that uses `window.open(url, '_blank', 'noopener,noreferrer')`.
- Add fallback behavior: if popup/new-tab is blocked, show a toast with a clear message and copyable URL.

2. Update News widget to use explicit JS open behavior
- In `src/components/command-center/NewsWidget.tsx`, replace row-level `<a>` navigation with click handlers that call the new helper.
- Keep the full-row clickable UX and external-link affordance.
- Keep current search fallback URL generation for now, but open via the helper (not raw anchor navigation).

3. Apply same fix to other Command Center external links
- Update `src/components/command-center/CalendarWidget.tsx` external icon link to use the same helper.
- Update `src/components/command-center/PodcastWidget.tsx` “Listen” link to use the same helper.
- This prevents similar iframe-block errors anywhere in Command Center.

Technical details:
- New utility API (example): `openExternalUrl(url: string, options?: { label?: string })`.
- Utility handles:
  - Secure new-tab open (`noopener,noreferrer`)
  - Null window return (popup blocked) fallback notification
- Components become button/click driven for navigation instead of relying on iframe-sensitive anchor behavior.

Validation:
- In `/command-center`, click multiple News items: each should open externally with no blocked-frame error screen.
- Click Calendar external icon and Podcast “Listen” links: should behave the same.
- Confirm behavior in both preview and published site.
