import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { parseGeoConfig } from "@/lib/geo/config";
import { reportForProject } from "@/lib/geo/report";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  const days = parseRange(daysParam);

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) notFound();

  const config = parseGeoConfig(project.configJson);
  const report = await reportForProject(projectId, days);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          Share-of-voice report
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {config?.brand.name ?? project.name} citation rate across AI engines.
        </p>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => {
          const active = r.days === days;
          return (
            <Link
              key={r.days}
              href={`/projects/${projectId}/report?days=${r.days}`}
              className={`text-sm rounded-md px-3 py-1.5 border ${
                active
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                  : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      {report.totalResults === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center text-sm text-neutral-500">
          No completed runs in this range. Trigger a run from the project
          overview.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Stat label="Runs" value={report.runCount} />
            <Stat label="Total responses" value={report.totalResults} />
            <Stat
              label="Brand cited"
              value={`${report.brandHits} / ${report.totalResults}`}
            />
            <Stat
              label="Share of voice"
              value={`${Math.round(report.brandRate * 100)}%`}
            />
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              By engine
            </h2>
            <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
              {report.byProvider.map((p) => (
                <li
                  key={p.provider}
                  className="px-4 py-3 text-sm flex items-center justify-between"
                >
                  <span className="font-medium">{p.provider}</span>
                  <div className="flex items-center gap-3">
                    <Bar pct={p.brandRate} />
                    <span className="tabular-nums text-neutral-500 w-24 text-right">
                      {p.brandHits} / {p.totalResults} ·{" "}
                      {Math.round(p.brandRate * 100)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              Competitors mentioned
            </h2>
            {report.competitors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center text-sm text-neutral-500">
                None of the configured competitors appeared in any response.
              </div>
            ) : (
              <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                {report.competitors.map((c) => (
                  <li
                    key={c.name}
                    className="px-4 py-3 text-sm flex items-center justify-between"
                  >
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <Bar pct={c.rate} tone="amber" />
                      <span className="tabular-nums text-neutral-500 w-24 text-right">
                        {c.hits} · {Math.round(c.rate * 100)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function parseRange(raw: string | undefined): number {
  const n = Number(raw);
  if (Number.isFinite(n) && RANGES.some((r) => r.days === n)) return n;
  return 7;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Bar({ pct, tone = "emerald" }: { pct: number; tone?: "emerald" | "amber" }) {
  const width = Math.round(Math.max(0, Math.min(1, pct)) * 100);
  const fill =
    tone === "amber"
      ? "bg-amber-500 dark:bg-amber-400"
      : "bg-emerald-500 dark:bg-emerald-400";
  return (
    <div className="w-32 h-2 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
      <div
        className={`h-full ${fill}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
