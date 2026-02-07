# Chief of Staff

A personal productivity dashboard for managing tasks and ideas, built with React, TypeScript, and Supabase.

## Features

- **Kanban Task Board** — Drag-and-drop tasks across status columns (Backlog, To-Do, In-Progress, Blocked, Done) with priority levels and due dates
- **Ideas Management** — Capture and track ideas with statuses (New, In-Progress, Parked, Done), and convert between tasks and ideas
- **Categories** — Organize tasks and ideas with emoji-tagged categories
- **Image Attachments** — Attach images via file picker, drag-and-drop, or clipboard paste (stored in Supabase Storage)
- **Dual Search** — Inline toolbar quick-search with keyboard navigation, plus a full command-palette modal (⌘K / Ctrl+K)
- **Deep-Link Editing** — Search results open items directly in edit mode via `?edit=<id>` URL parameters

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Database, Storage, Edge Functions) |
| State | TanStack Query |
| Drag & Drop | @hello-pangea/dnd |
| Routing | React Router v6 |

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Project Structure

```
src/
├── components/
│   ├── dashboard/     # Dashboard widgets (QuickAdd)
│   ├── ideas/         # Idea cards and forms
│   ├── layout/        # AppLayout, AppSidebar
│   ├── search/        # InlineSearch, SearchModal
│   ├── tasks/         # TaskCard, TaskForm, KanbanColumn
│   └── ui/            # shadcn/ui primitives
├── contexts/          # AppContext (global state)
├── hooks/             # useTasks, useIdeas, useCategories, etc.
├── pages/             # Route pages (Index, Tasks, Ideas, Categories)
└── types/             # TypeScript interfaces
```

## Deployment

Open the project in [Lovable](https://lovable.dev) and click **Share → Publish**, or connect a custom domain via **Project → Settings → Domains**.
