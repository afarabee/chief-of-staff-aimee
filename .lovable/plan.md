

# Podcast Feed Widget on Command Center

## Overview

Add a "My Podcasts" widget to the Command Center that fetches latest episodes from user-managed RSS feeds and displays them with links to listen.

## Architecture

```text
User manages podcast list (name + RSS URL) in a new DB table
       │
       ▼
New Edge Function: "fetch-podcasts"
  - Reads podcast_feeds table
  - Fetches each RSS feed XML, parses latest 1-2 episodes per feed
  - Returns structured JSON: [{podcast, episode_title, published, url, description}]
       │
       ▼
Command Center widget displays latest episodes with external links
```

## Changes

### 1. New DB table: `podcast_feeds`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Podcast name |
| rss_url | text | RSS feed URL |
| created_at | timestamptz | Default now() |

Open RLS policy (matches existing pattern). Users can add/remove feeds from the widget itself.

### 2. New Edge Function: `supabase/functions/fetch-podcasts/index.ts`

- Reads all rows from `podcast_feeds`
- For each feed, fetches the RSS XML and parses the latest 2 episodes (title, link, pubDate, description snippet)
- Returns `{ episodes: [{ podcastName, title, url, published, snippet }] }` sorted by date
- Register in `config.toml`

### 3. New Hook: `src/hooks/usePodcasts.ts`

- `usePodcastFeeds()` — CRUD for the `podcast_feeds` table (list, add, delete)
- `usePodcastEpisodes()` — calls the `fetch-podcasts` edge function, React Query with 30-min staleTime

### 4. Update `src/pages/CommandCenter.tsx`

- Add a "My Podcasts" widget card (orange/amber theme, Podcast icon) after the AI News card
- Shows latest episodes across all feeds, each with podcast name badge, episode title, published date, and external link
- "Manage" button opens a small dialog to add/remove podcast RSS feeds (name + URL input)
- Loading skeleton while fetching
- Wire into the existing Refresh button

### 5. Manage Feeds Dialog

- Simple dialog with a list of current feeds (name + delete button) and an "Add" form (name + RSS URL)
- Inline within CommandCenter or a small component

