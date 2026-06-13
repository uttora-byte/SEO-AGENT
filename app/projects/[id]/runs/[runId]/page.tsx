import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoPrompts, geoResults, geoRuns, projects } from "@/lib/db/schema";
import { reportForRun } from "@/lib/geo/report";
import { deleteGeoRun } from "../actions";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId: runIdStr } = await params;
  const projectId = Number(id);
  const runId = Number(runIdStr);
  if (!Number.isFinite(projectId) || !Number.isFinite(runId)) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) notFound();

  const [run] = await db.select().from(geoRuns).where(eq(geoRuns.id, runId));
  if (!run || run.projectId !== projectId) notFound();

  const [rows, prompts, report] = await Promise.all([
    db.select().from(geoResults).where(eq(geoResults.runId, runId)),
    db.select().from(geoPrompts).where(eq(geoPrompts.projectId, projectId)),
    reportForRun(runId),
  ]);

  const promptMap = new Map(prompts.map((p) => [p.id, p]));
  const grouped = groupByPrompt(rows);
  const deleteAction = deleteGeoRun.bind(null, projectId, runId);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {project.name}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Run #{run.id}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {formatDate(run.startedAt)}
              {run.finishedAt ? ` → ${formatDate(run.finishedAt)}` : ""} ·{" "}
              {run.status}
            </p>
            {run.errorMessage ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {run.errorMessage}
              </p>
            ) : null}
          </div>
          <form action={deleteAction}>
            <button
              type="submit"
              className="text-xs rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              Delete run
            </button>
          </form>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Responses" value={report.totalResults} />
        <Stat
          label="Brand cited"
          value={`${report.brandHits} / ${report.totalResults}`}
        />
        <Stat label="Share of voice" value={formatPct(report.brandRate)} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          By engine
        </h2>
        <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
          {report.byProvider.length === 0 ? (
            <li className="px-4 py-3 text-sm text-neutral-500">
              No responses recorded.
            </li>
          ) : (
            report.byProvider.map((p) => (
              <li
                key={p.provider}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium">{p.provider}</span>
                <span className="text-neutral-500">
                  {p.brandHits} / {p.totalResults} · {formatPct(p.brandRate)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Responses by prompt
        </h2>
        {grouped.size === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
            No results recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([promptId, results]) => {
              const prompt = promptMap.get(promptId);
              return (
                <details
                  key={promptId}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                >
                  <summary className="px-4 py-3 cursor-pointer text-sm flex items-center justify-between gap-3">
                    <span className="font-medium truncate">
                      {prompt?.promptText ?? `Prompt #${promptId}`}
                    </span>
                    <span className="text-xs text-neutral-500 shrink-0">
                      {results.filter((r) => r.brandCited).length} /{" "}
                      {results.length} cited
                    </span>
                  </summary>
                  <ul className="border-t border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
                    {results.map((r) => {
                      const competitors = safeParseArray(
                        r.competitorsCitedJson,
                      );
                      const sources = safeParseArray(r.sourcesJson);
                      return (
                        <li key={r.id} className="px-4 py-3 text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                              {r.provider}
                            </span>
                            {r.model ? (
                              <span className="text-xs text-neutral-400">
                                {r.model}
                              </span>
                            ) : null}
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                r.brandCited
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                              }`}
                            >
                              {r.brandCited ? "brand cited" : "no brand"}
                            </span>
                            {competitors.length > 0 ? (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                vs. {competitors.join(", ")}
                              </span>
                            ) : null}
                          </div>
                          <pre className="text-xs whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 font-sans">
                            {r.responseText}
                          </pre>
                          {sources.length > 0 ? (
                            <div className="text-xs text-neutral-500">
                              Sources:{" "}
                              {sources.map((s, i) => (
                                <span key={i}>
                                  {i > 0 ? ", " : ""}
                                  <a
                                    href={s}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                  >
                                    {hostnameOf(s)}
                                  </a>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function groupByPrompt(rows: (typeof geoResults.$inferSelect)[]) {
  const map = new Map<number, (typeof geoResults.$inferSelect)[]>();
  for (const r of rows) {
    const list = map.get(r.promptId) ?? [];
    list.push(r);
    map.set(r.promptId, list);
  }
  return map;
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function formatDate(d: Date | number | null): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString();
}

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
