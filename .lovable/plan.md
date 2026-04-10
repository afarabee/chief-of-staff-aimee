
# Fix: Multi-Calendar Support + Build Errors

## Changes

### 1. `supabase/functions/get-todays-calendar/index.ts` — Query multiple calendars
- Read both `GOOGLE_CALENDAR_ID` and `GOOGLE_PERSONAL_CALENDAR_ID`
- Fetch events from each configured calendar in parallel
- Merge results, deduplicate by event ID, sort by start time
- Tag each event with a `source` field ("personal" or "app") for potential future styling

### 2. `src/hooks/useHandoffSummaries.ts` — Fix build error
- The `handoff_summaries` table doesn't exist in the generated Supabase types
- Use `.from('handoff_summaries' as any)` cast or switch to a raw RPC/fetch to silence the type error
- Cast the response data through `unknown` to `HandoffSummary[]`

### 3. New secret: `GOOGLE_PERSONAL_CALENDAR_ID`
- Add via the secrets tool (value = your Gmail address / personal calendar ID)

## Manual prerequisite
You need to share your personal Google Calendar with the service account email (read-only "See all event details"). The service account email is in your `GOOGLE_CALENDAR_SERVICE_KEY` JSON's `client_email` field.

| File | Change |
|------|--------|
| `supabase/functions/get-todays-calendar/index.ts` | Multi-calendar fetch, merge, dedup |
| `src/hooks/useHandoffSummaries.ts` | Fix TS2769 type error |
| Secret: `GOOGLE_PERSONAL_CALENDAR_ID` | New secret to add |
