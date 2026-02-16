<h2>Project Overview</h2>
<p>Chief of Staff is a personal life operations app that helps me manage everything from home maintenance schedules to financial planning to pet care. It combines a Kanban-style task board, an asset tracking system, a maintenance scheduler with recurring tasks, service provider management, and an AI chatbot that can read and write data across the entire system.</p>
<p>The app pulls together the kinds of things that usually live in scattered spreadsheets, sticky notes, and calendar reminders into one place — and gives me an AI assistant that actually knows about all of it.</p>

<h2>The Problem</h2>
<p>Managing a household involves tracking a surprising number of moving parts: insurance renewals, vehicle maintenance, home repairs, vet appointments, financial tasks, and dozens of recurring to-dos that are easy to forget until they become urgent. I was juggling multiple apps, spreadsheets, and mental notes. Nothing talked to each other, and nothing was smart enough to help me stay ahead of things.</p>
<p>I wanted a single system that could hold all of it — and an AI layer on top that could answer questions like "when is the boat insurance due?" or "add a task to call the vet" without me navigating through menus or multiple files.</p>

<h2>The Approach</h2>
<p>I built Chief of Staff using a workflow I developed during this project: AI-assisted prompt engineering for no-code development.</p>
<p>Here's how it worked:</p>
<ol>
<li><strong>Architecture with Claude Code.</strong> I started by having Claude Code analyze an earlier prototype I'd built in Google AI Studio. Together, we mapped out the database schema, identified the features worth keeping, and designed the system architecture — two separate task systems (Kanban for ad-hoc tasks, a maintenance table for asset-linked recurring tasks), a shared category system, and an AI integration layer.</li>
<li><strong>Prompt engineering for Lovable.</strong> Rather than writing code directly, Claude Code generated detailed, implementation-ready prompts that I pasted into Lovable. Each prompt was a complete feature specification — database schema changes, component structure, API calls, edge cases, and UI behavior. Lovable turned those specs into working React code.</li>
<li><strong>Iterative refinement.</strong> After each feature was implemented, I'd test it, identify issues, and work with Claude Code to write targeted fix prompts. We batched small fixes together to conserve Lovable's generation credits.</li>
<li><strong>AI integration with Gemini.</strong> The chatbot uses Google's Gemini API through Supabase Edge Functions. It has full context about my assets, tasks, ideas, providers, and maintenance schedules. Using Gemini's function calling feature, it can create and update records through natural conversation — "add a task to cancel the Netflix subscription" or "mark the oil change as done."</li>
<li><strong>CLI tooling with Claude Code.</strong> I built a /backlog slash command that lets me create, search, update, and split tasks and ideas directly from the terminal without opening the app. It talks to Supabase's REST API and handles natural language input.</li>
</ol>

<h2>Key Features</h2>
<ul>
<li><strong>Kanban Board</strong> — Drag-and-drop task management with backlog, to-do, in-progress, blocked, and done columns</li>
<li><strong>Asset Library</strong> — Track everything you own, organized by category (Home, Auto, Boat, Property, Pets, Health, Personal)</li>
<li><strong>Maintenance Scheduler</strong> — Recurring and one-time tasks linked to specific assets, with automatic next-occurrence generation</li>
<li><strong>AI Chatbot</strong> — Gemini-powered assistant with full database read/write via function calling (8 CRUD operations)</li>
<li><strong>AI Task Suggestions</strong> — Generate a maintenance plan for any asset with one click; accept or reject each suggestion</li>
<li><strong>Calendar Views</strong> — Monthly, weekly, and daily views pulling from both task systems, with color-coded task types and double-click to create</li>
<li><strong>Service Provider Directory</strong> — Track contacts for mechanics, vets, contractors, and other service providers, linked to assets and tasks</li>
<li><strong>Ideas Board</strong> — Capture and track ideas separately from actionable tasks</li>
<li><strong>CLI Integration</strong> — Terminal-based task management via Claude Code slash commands</li>
</ul>

<h2>Why It Matters</h2>
<p>This project demonstrates that building sophisticated, full-stack applications is no longer gated by knowing how to code. The combination of AI tools (Claude Code for architecture and prompt engineering, Lovable for code generation, Gemini for in-app intelligence) allowed me to go from concept to a production app with real AI capabilities — all without writing or editing a single line of code manually.</p>
<p>The prompt engineering workflow I developed is transferable. The same approach — having an AI architect write detailed specs for a no-code builder — could be applied to any app idea. The key insight is that the bottleneck isn't coding skill; it's the ability to think clearly about what you want the system to do and communicate that precisely.</p>

<h2>What I Learned</h2>
<ul>
<li><strong>Prompt specificity matters.</strong> Vague prompts to Lovable produced vague results. The more detailed and structured the specification — including exact field names, status values, edge cases, and UI behavior — the better the output. Claude Code's ability to generate these precise specs was the multiplier.</li>
<li><strong>Database design is the foundation.</strong> Getting the schema right early (two task tables, shared categories, proper foreign keys) saved enormous time later. Every feature built on top of that foundation cleanly because the data model was sound.</li>
<li><strong>AI integrations need guardrails.</strong> The Gemini chatbot works well because it has structured context (not a raw data dump) and clear function definitions. Without those constraints, the AI would hallucinate actions or misidentify records.</li>
<li><strong>Batch your changes.</strong> Working with credit-based tools like Lovable taught me to think in batches — group related fixes into a single prompt instead of burning credits on one-line changes. This also forced better planning.</li>
<li><strong>No-code doesn't mean no thinking.</strong> I didn't write code, but I made every architectural decision: which tables to create, how statuses should flow, what the AI should and shouldn't be able to do, how recurring tasks should generate. The tools handled the implementation; the product thinking was all mine.</li>
</ul>


<h2>What's Next</h2>
<ul>
<li><strong>Addition of Reminders.</strong> I'll connect to n8n and Google calendar MCP to schedule ad-hoc and recurring reminders for the to-do's and maintenance tasks. 
<li><strong>Real-time Voice Interaction.</strong> I vibe coded an app in Google AI Studio a few months back called "Audio Orb". It's a real-time, voice-interactive experience powered by the Gemini Live API. It allows users to have a low-latency, natural conversation with an AI model through their microphone.
</ul>

---


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

---


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

---

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

---

## Credit goes to the following podcasts, as inspiration for my COS app: 

[How I AI Episode: "Claude Code for product managers: research, writing, context libraries, custom to-do system, more" ](https://youtu.be/oBho3hZ7MHM?si=66TLdlMaym9o1JS2)

[How I AI Episode: "How Webflow’s CPO built an AI chief of staff to manage her calendar and drive internal AI adoption"](https://youtu.be/BTcG59ZR9sg?si=Tmb9wKTKcThl9-uo)
