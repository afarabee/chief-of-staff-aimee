# Chief of Staff

A personal life operations app that brings together home maintenance, financial planning, pet care, and everything else into one place — with an AI assistant that can read and write across the entire system.

## The Problem

Managing a household means tracking insurance renewals, vehicle maintenance, home repairs, vet appointments, financial tasks, and dozens of recurring to-dos across scattered spreadsheets, calendar reminders, and mental notes. Nothing talks to each other, and nothing is smart enough to help you stay ahead.

## Key Features

- **Kanban Board** — Drag-and-drop task management with backlog, to-do, in-progress, blocked, and done columns
- **Asset Library** — Track everything you own, organized by category (Home, Auto, Boat, Property, Pets, Health, Personal)
- **Maintenance Scheduler** — Recurring and one-time reminders linked to specific assets, with automatic next-occurrence generation
- **AI Chatbot** — Gemini-powered assistant with full database read/write via function calling (8 CRUD operations)
- **AI Enrichment System** — Generate actionable AI suggestions for any task, idea, or reminder. Suggestions are managed on a dedicated AI Activity page (`/ai-activity`) with execute, dismiss, and create-subtask actions
- **Calendar Views** — Monthly, weekly, and daily views pulling from both task systems, with color-coded task types and double-click to create
- **Service Provider Directory** — Track contacts for mechanics, vets, contractors, linked to assets and tasks
- **Ideas Board** — Capture and track ideas separately from actionable tasks
- **CLI Integration** — Terminal-based task management via Claude Code slash commands

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Database, Auth, Edge Functions) |
| State | TanStack Query |
| AI | Google Gemini 2.0 Flash (via Edge Functions) |
| Drag & Drop | @hello-pangea/dnd |
| Routing | React Router v6 |

## Project Structure

```
src/
├── components/
│   ├── assets/          # Asset cards and forms
│   ├── calendar/        # Monthly, weekly, daily views
│   ├── chat/            # AI chatbot
│   ├── dashboard/       # Dashboard widgets
│   ├── ideas/           # Idea cards and forms
│   ├── layout/          # AppLayout, AppSidebar
│   ├── links/           # Linked assets/providers sections
│   ├── maintenance/     # Maintenance task cards and forms
│   ├── providers/       # Provider cards and forms
│   ├── search/          # InlineSearch, SearchModal
│   ├── tasks/           # TaskCard, TaskForm, KanbanColumn
│   └── ui/              # shadcn/ui primitives
├── contexts/            # AppContext (global state)
├── hooks/               # Data hooks (useTasks, useIdeas, useAiEnrichments, etc.)
├── pages/               # Route pages
├── types/               # TypeScript interfaces
└── integrations/        # Supabase client and types

supabase/
└── functions/
    ├── chat/            # AI chatbot edge function
    ├── enrich-item/     # AI suggestion generation
    └── execute-suggestion/ # AI suggestion execution
```

## Architecture Highlights

### AI Enrichment System

AI suggestions are decoupled from item records and stored in a dedicated `ai_enrichments` table. When a user clicks "Enrich with AI" on any form:

1. The item is auto-saved (created or updated)
2. The `enrich-item` Edge Function calls Gemini to generate 3–5 actionable suggestions
3. Suggestions are stored as JSONB in `ai_enrichments` with status tracking (`pending`, `executed`, `dismissed`)
4. Users manage suggestions on a full-page detail view at `/ai-activity/:id`

Executed suggestions are also logged to an append-only `ai_executions` table for historical tracking.

### Two Task Systems

- **Kanban tasks** (`cos_tasks`): Ad-hoc tasks with status, priority, due dates, and subtask support
- **Maintenance reminders** (`tasks`): Asset-linked recurring tasks with recurrence rules and cost tracking

Both systems feed into the unified calendar views.

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
