import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  geoPrompts,
  geoRuns,
  projects,
} from "@/lib/db/schema";
import { parseGeoConfig } from "@/lib/geo/config";
import { getAvailableProviders } from "@/lib/providers";
import { updateGeoProject, deleteGeoProject } from "./actions";
import { triggerGeoRun } from "./runs/actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) notFound();

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, project.clientId));

  const [activePrompts, recentRuns, availableProviders] = await Promise.all([
    db
      .select()
      .from(geoPrompts)
      .where(
        and(eq(geoPrompts.projectId, projectId), eq(geoPrompts.isActive, true)),
      ),
    db
      .select()
      .from(geoRuns)
      .where(eq(geoRuns.projectId, projectId))
      .orderBy(desc(geoRuns.startedAt))
      .limit(10),
    getAvailableProviders(),
  ]);

  const config = parseGeoConfig(project.configJson);
  const triggerAction = triggerGeoRun.bind(null, projectId);
  const updateAction = updateGeoProject.bind(null, projectId);
  const deleteAction = deleteGeoProject.bind(null, projectId);

  const canRun =
    activePrompts.length > 0 &&
    availableProviders.length > 0 &&
    Boolean(config?.brand.name);

  return (
    <div className="space-y-10">
      <div>
        {client ? (
          <Link
            href={`/clients/${client.id}`}
            className="text-sm text-neutral-500 hover:underline"
          >
            ← {client.name}
          </Link>
        ) : null}
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              GEO tracker · {project.status}
              {config?.brand.name ? ` · brand: ${config.brand.name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projects/${projectId}/prompts`}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Prompts
            </Link>
            <Link
              href={`/projects/${projectId}/report`}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Report
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Run citation check</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Queries every configured AI engine with your active prompts and
              scores each response for brand and competitor mentions.
            </p>
          </div>
          <form action={triggerAction}>
            <button
              type="submit"
              disabled={!canRun}
              className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Run now
            </button>
          </form>
        </div>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>
            {activePrompts.length} active prompt
            {activePrompts.length === 1 ? "" : "s"}
            {activePrompts.length === 0 ? " — add prompts to enable runs" : ""}
          </li>
          <li>
            {availableProviders.length} provider
            {availableProviders.length === 1 ? "" : "s"} ready:{" "}
            {availableProviders.map((p) => p.label).join(", ") || "none"}
          </li>
          {!config?.brand.name ? (
            <li className="text-rose-500">
              Brand name missing — set it in project settings below.
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Recent runs
        </h2>
        {recentRuns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
            No runs yet. Click <strong>Run now</strong> above to query the
            configured engines.
          </div>
        ) : (
          <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
            {recentRuns.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/projects/${projectId}/runs/${r.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <div>
                    <div className="font-medium">
                      Run #{r.id} ·{" "}
                      <span className="font-normal text-neutral-500">
                        {formatDate(r.startedAt)}
                      </span>
                    </div>
                    {r.errorMessage ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        {r.errorMessage}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${runStatusCls(r.status)}`}
                  >
                    {r.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Project settings
        </h2>
        <form action={updateAction} className="space-y-4 max-w-xl">
          <Field label="Project name" required>
            <input
              type="text"
              name="name"
              required
              defaultValue={project.name}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={project.status}
              className={inputCls}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Brand name" required>
            <input
              type="text"
              name="brandName"
              required
              defaultValue={config?.brand.name ?? ""}
              className={inputCls}
            />
          </Field>
          <Field
            label="Brand aliases"
            hint="One per line."
          >
            <textarea
              name="brandAliases"
              rows={3}
              defaultValue={config?.brand.aliases.join("\n") ?? ""}
              className={inputCls}
            />
          </Field>
          <Field
            label="Competitors"
            hint="One per line."
          >
            <textarea
              name="competitors"
              rows={5}
              defaultValue={
                config?.competitors.map((c) => c.name).join("\n") ?? ""
              }
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Save project
          </button>
        </form>
      </section>

      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-3">
          Danger zone
        </h2>
        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-md border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-2 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            Delete project and all runs
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

function formatDate(d: Date | number | null): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString();
}

function runStatusCls(status: string): string {
  switch (status) {
    case "complete":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "running":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    case "failed":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  }
}
