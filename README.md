# SEO Agent

Internal platform for delivering SEO services to clients. Three modules in one app:

| Module | What it does |
|---|---|
| **GEO Tracker** | Measures brand citations across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews. Weekly share-of-voice reports per client. |
| **Programmatic SEO** | Generates landing pages from a CSV + AI templates, publishes via GitHub PRs to client repos, auto-deploys via static hosting. |
| **Local SEO** | Google Business Profile monitoring, local rank tracking, reviews, citation checklists. |

Built local-first: runs on your laptop with zero hosting cost until you have paying clients.

## Requirements

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **git**
- **OS**: macOS or Windows (Linux works too)
- *Optional but recommended:* the [Claude Code CLI](https://claude.com/claude-code) — lets you use your existing subscription for content generation instead of paying for API calls.

## Setup

```bash
# Clone
git clone https://github.com/uttora-byte/SEO-AGENT.git
cd SEO-AGENT

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically on first request.

Configure LLM providers and integrations in **Settings**. You need at least one LLM provider:

- **Claude Code CLI** — auto-detected if `claude` is on PATH. Uses your subscription. Zero per-token cost.
- **Anthropic / OpenAI / Gemini / Perplexity** — paste an API key in Settings. The GEO Tracker needs OpenAI + Gemini + Perplexity keys to measure citations across all engines.
- **SerpAPI** — optional, used by Local SEO for rank tracking.
- **GitHub token** — used by Programmatic SEO to create client repos and PRs. Needs `repo` scope.

## Project structure

```
app/                 Next.js App Router routes
  page.tsx           Dashboard
  settings/          API keys, region, default provider
  clients/           Client CRM (list, new, detail/edit)
lib/
  db/                Drizzle ORM schema + SQLite connection
  providers/         LLM provider abstraction (Claude CLI, Anthropic, OpenAI, Gemini, Perplexity)
  settings.ts        Settings read/write helpers
drizzle/             Generated SQL migrations (committed)
seo-agent.db         Local SQLite database (gitignored)
```

## Database

SQLite via `better-sqlite3` + Drizzle ORM. Migrations live in `drizzle/` and apply automatically on dev server start. To create a new migration after editing `lib/db/schema.ts`:

```bash
npm run db:generate -- --name <change_summary>
```

Open Drizzle Studio to inspect data:

```bash
npm run db:studio
```

## Development phases

- **Phase 0 — Foundation** *(current)*: project scaffold, schema, settings, client CRM, provider abstraction.
- **Phase 1 — GEO Tracker**: prompt list per project, multi-engine polling, citation detection, weekly report.
- **Phase 2 — Programmatic SEO**: CSV upload, template generation, GitHub PR pipeline.
- **Phase 3 — Local SEO**: GBP integration, rank tracking, review monitor.

## License

Private / internal use.
