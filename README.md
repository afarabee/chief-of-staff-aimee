# Chief of Staff

Your AI-powered personal life operations dashboard — bringing together home maintenance, task management, financial planning, and everything else into one place.

## The Problem

Managing a household means tracking insurance renewals, vehicle maintenance, home repairs, vet appointments, financial tasks, and dozens of recurring to-dos across scattered spreadsheets, calendar reminders, and mental notes. Nothing talks to each other, and nothing is smart enough to help you stay ahead.

## Key Features

- **Command Center** — Personalized daily dashboard with weather, calendar, AI briefing, news, podcasts, and idea spotlight widgets (drag to reorder, hide/show)
- **Kanban Board** — Drag-and-drop task management with backlog, to-do, in-progress, blocked, and done columns
- **Asset Library** — Track everything you own, organized by category (Home, Auto, Boat, Property, Pets, Health, Personal)
- **Maintenance Scheduler** — Recurring and one-time reminders linked to specific assets, with automatic next-occurrence generation and "this instance or all future" editing for recurring tasks
- **Google Calendar Integration** — Schedule any task or maintenance event to Google Calendar with custom times, reminders, and timezone support
- **AI Chatbot** — Gemini-powered assistant with full database read/write via function calling (8 CRUD operations)
- **AI Enrichment System** — Generate actionable AI suggestions for any task, idea, or reminder. Manage suggestions on a dedicated AI Activity page with execute, dismiss, and create-subtask actions
- **Daily Briefing** — AI-generated daily summary with smart suggestions (reschedule, focus, unblock) linked to actionable items
- **Calendar Views** — Monthly, weekly, and daily views pulling from both task systems, with color-coded task types
- **Shopping List** — Quick-capture checklist for shopping items
- **Service Provider Directory** — Track contacts for mechanics, vets, contractors, linked to assets and tasks
- **Ideas Board** — Capture and track ideas separately from actionable tasks, with two-way task/idea conversion
- **Global Search** — Search across all tasks, ideas, assets, and providers from any page
- **Smart Toast Notifications** — Auto-dismissing, clickable notifications that navigate to the relevant item

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Backend | Supabase (Database, Auth, Edge Functions) |
| State | TanStack Query v5 |
| AI | Google Gemini 2.0 Flash (via Edge Functions) |
| Drag & Drop | @hello-pangea/dnd |
| Routing | React Router v6 |
| Charts | Recharts |

## Project Structure

```
src/
├── components/
│   ├── assets/          # Asset cards, forms, and AI suggestions
│   ├── calendar/        # Monthly, weekly, daily views + task popovers
│   ├── chat/            # AI chatbot with voice input
│   ├── command-center/  # Dashboard widgets (briefing, weather, calendar, news, podcasts)
│   ├── dashboard/       # Quick-add capture
│   ├── ideas/           # Idea cards and forms
│   ├── layout/          # AppLayout, AppSidebar, NotificationBell
│   ├── links/           # Linked assets/providers sections
│   ├── providers/       # Provider cards and forms
│   ├── search/          # InlineSearch, SearchModal
│   ├── tasks/           # TaskCard, TaskForm, KanbanColumn
│   └── ui/              # shadcn/ui primitives
├── contexts/            # AppContext (global state with task/idea CRUD + conversions)
├── hooks/               # 30+ custom hooks (data fetching, AI enrichment, calendar sync, etc.)
├── pages/               # Route pages (14 pages)
├── types/               # TypeScript interfaces
├── utils/               # Frequency calculations, title generation
└── integrations/        # Supabase client and generated types

supabase/
└── functions/
    ├── ai-news/                # AI-curated news feed
    ├── chat/                   # AI chatbot with function calling
    ├── create-calendar-event/  # Google Calendar event creation (timed + reminders)
    ├── daily-briefing/         # AI daily briefing generation
    ├── enrich-item/            # AI suggestion generation
    ├── execute-suggestion/     # AI suggestion execution
    ├── fetch-podcasts/         # Podcast RSS feed fetching
    ├── get-todays-calendar/    # Today's Google Calendar events
    ├── parse-asset-document/   # Document parsing for assets
    ├── send-daily-digest/      # Email digest delivery
    ├── sync-calendar-events/   # Calendar sync
    └── update-calendar-event/  # Calendar event updates
```

## Architecture Highlights

### AI Enrichment System

AI suggestions are decoupled from item records and stored in a dedicated `ai_enrichments` table. When a user clicks "Enrich with AI" on any form:

1. The item is auto-saved (created or updated)
2. The `enrich-item` Edge Function calls Gemini to generate 3–5 actionable suggestions
3. Suggestions are stored as JSONB in `ai_enrichments` with status tracking (`pending`, `executed`, `dismissed`)
4. Users manage suggestions on a full-page detail view at `/ai-activity/:id`

Executed suggestions are also logged to an append-only `ai_executions` table for historical tracking.

### Google Calendar Integration

Tasks and maintenance events can be scheduled to Google Calendar with:
- Specific start times (or all-day events)
- Configurable reminders (5min to 1 week before)
- Timezone-aware scheduling
- Direct links back to the calendar event from toast notifications

### Scheduled Jobs

The daily digest email is triggered by a GitHub Actions workflow (`.github/workflows/daily-digest.yml`), not Supabase pg_cron. Two cron slots (10:15 and 11:15 UTC) cover DST and standard time; a DST-aware guard inside `send-daily-digest` early-exits unless the current hour in `America/Chicago` is 5 AM, so exactly one email fires at 5:15 AM Central year-round.

- **Required secret**: `SUPABASE_SERVICE_ROLE_KEY` (GitHub → Settings → Secrets and variables → Actions)
- **Manual run**: Actions tab → _Daily Digest Email_ → **Run workflow** (leave `force` checked to bypass the 5 AM guard)
- **Failures** surface as red ❌ in the Actions tab with full curl output — no silent cron failures

### Two Task Systems

- **Kanban tasks** (`cos_tasks`): Ad-hoc tasks with status, priority, due dates, subtask support, and category organization
- **Maintenance reminders** (`tasks`): Asset-linked recurring tasks with recurrence rules, cost tracking, and provider associations

Both systems feed into the unified calendar views.

### Companion Apps

- **CFO Dashboard** — Financial planning and budget tracking (separate Lovable app)
- **Workout Tracker** — Exercise logging and rep tracking (separate app)

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

The app will be available at `http://localhost:8080`.

## Deployment

Open the project in [Lovable](https://lovable.dev) and click **Share → Publish**, or connect a custom domain via **Project → Settings → Domains**.

## Credits

Inspired by:

- [How I AI: "Claude Code for product managers"](https://youtu.be/oBho3hZ7MHM?si=66TLdlMaym9o1JS2)
- [How I AI: "How Webflow's CPO built an AI chief of staff"](https://youtu.be/BTcG59ZR9sg?si=Tmb9wKTKcThl9-uo)
