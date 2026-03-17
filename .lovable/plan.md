

# Command Center Enhancements

Three changes: Google Calendar today widget, configurable layout, and clickable news items.

## 1. Today's Google Calendar Events Widget

**New Edge Function: `supabase/functions/get-todays-calendar/index.ts`**
- Reuses existing Google Calendar service account auth pattern (from `sync-calendar-events`)
- Fetches today's events from Google Calendar API using `timeMin`/`timeMax` for current day
- Returns `{ events: [{ id, summary, start, end, htmlLink, status }] }` sorted by start time
- Register in `config.toml` with `verify_jwt = false`

**New Hook: `src/hooks/useTodaysCalendar.ts`**
- Calls the edge function via `supabase.functions.invoke('get-todays-calendar')`
- React Query with 10-min staleTime
- Returns typed array of calendar events

**New Widget: `src/components/command-center/CalendarWidget.tsx`**
- Card with calendar icon, blue/indigo theme
- Lists today's events with time, title, and external link to Google Calendar
- Shows "No events today" empty state
- Skeleton loading state

## 2. Configurable Layout

**New DB table: `command_center_config`**
- Single-row table: `id uuid PK`, `widget_order text[]`, `hidden_widgets text[]`, `created_at`, `updated_at`
- Default widget order: `['briefing', 'weather', 'calendar', 'ideaSpotlight', 'news', 'podcasts']`
- Open RLS (matches existing pattern)

**New Hook: `src/hooks/useCommandCenterConfig.ts`**
- Read/upsert the config row
- Exposes `widgetOrder`, `hiddenWidgets`, `toggleWidget(id)`, `reorderWidgets(newOrder)`

**UI Changes in CommandCenter.tsx:**
- Add a "Customize" button (Settings icon) next to Refresh in the header
- Opens a dialog listing all widgets with:
  - Toggle switches to show/hide each widget
  - Drag handles or up/down arrows to reorder
- Render widgets dynamically based on `widgetOrder` filtered by `hiddenWidgets`
- Each widget becomes a standalone component keyed by ID for clean mapping

## 3. Clickable AI News Items

Simple change — make each news article row an `<a>` tag wrapping the entire item when a URL exists, so clicking anywhere on the row opens the article. Add `cursor-pointer hover:bg-emerald-100/50` styling. Keep the existing small "Read" link as well.

## File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/get-todays-calendar/index.ts` | Create |
| `supabase/config.toml` | Add function entry |
| `src/hooks/useTodaysCalendar.ts` | Create |
| `src/hooks/useCommandCenterConfig.ts` | Create |
| `src/components/command-center/CalendarWidget.tsx` | Create |
| `src/pages/CommandCenter.tsx` | Refactor to dynamic widget rendering + clickable news |
| `src/components/command-center/PodcastWidget.tsx` | No change |
| Migration SQL | Create `command_center_config` table |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

