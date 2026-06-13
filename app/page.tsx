import Link from "next/link";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getMaskedSettings } from "@/lib/settings";
import { claudeCliProvider } from "@/lib/providers/anthropic-cli";

export const dynamic = "force-dynamic";

const MODULES = [
  {
    id: "geo",
    title: "GEO Tracker",
    description:
      "Measure brand citations across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews. Weekly share-of-voice reports.",
    status: "Phase 1",
  },
  {
    id: "programmatic",
    title: "Programmatic SEO",
    description:
      "Generate hundreds of landing pages from a CSV + AI templating. Publish to a client GitHub repo, auto-deploy via Pages.",
    status: "Phase 2",
  },
  {
    id: "local",
    title: "Local SEO",
    description:
      "Google Business Profile monitoring, local rank tracking, review summaries, citation checklist.",
    status: "Phase 3",
  },
];

export default async function HomePage() {
  const [clientCount, projectCount, masked, claudeAvailable] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .then((rows) => rows[0]?.count ?? 0),
    getMaskedSettings(),
    claudeCliProvider.isAvailable(),
  ]);

  const providerStatus = [
    { label: "Claude Code CLI", ok: claudeAvailable },
    { label: "Anthropic API", ok: masked.hasAnthropicApiKey },
    { label: "OpenAI", ok: masked.hasOpenaiApiKey },
    { label: "Gemini", ok: masked.hasGoogleApiKey },
    { label: "Perplexity", ok: masked.hasPerplexityApiKey },
  ];
  const configuredCount = providerStatus.filter((p) => p.ok).length;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Internal SEO services platform.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Clients" value={clientCount} href="/clients" />
        <Stat label="Active projects" value={projectCount} />
        <Stat
          label="LLM providers configured"
          value={`${configuredCount} / 5`}
          href="/settings"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{m.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {m.status}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Provider status</h2>
        <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
          {providerStatus.map((p) => (
            <li
              key={p.label}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span>{p.label}</span>
              <span
                className={
                  p.ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-400"
                }
              >
                {p.ok ? "Ready" : "Not configured"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500 mt-2">
          Configure missing providers in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
