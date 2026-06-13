import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoPrompts, projects } from "@/lib/db/schema";
import { addPrompts, togglePrompt, deletePrompt } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";

export default async function PromptsPage({
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

  const prompts = await db
    .select()
    .from(geoPrompts)
    .where(eq(geoPrompts.projectId, projectId))
    .orderBy(desc(geoPrompts.createdAt));

  const addAction = addPrompts.bind(null, projectId);
  const activeCount = prompts.filter((p) => p.isActive).length;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Prompts</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {prompts.length} total · {activeCount} active. Active prompts are
          sent to every configured engine on each run.
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="font-semibold mb-3">Add prompts</h2>
        <form action={addAction} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Prompts</span>
            <textarea
              name="prompts"
              required
              rows={5}
              placeholder={
                "One per line, written the way a real user would ask.\n\nbest CRM for SaaS startups\nwhat is the most accurate weather API\ntop 5 background check services in the US"
              }
              className={inputCls}
            />
            <span className="block text-xs text-neutral-500">
              You can paste many at once — one per line.
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Tags (optional)</span>
            <input
              type="text"
              name="tags"
              placeholder="e.g. transactional, top-of-funnel"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Add to prompt list
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          All prompts
        </h2>
        {prompts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
            No prompts yet.
          </div>
        ) : (
          <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
            {prompts.map((p) => {
              const toggleAction = togglePrompt.bind(
                null,
                projectId,
                p.id,
                !p.isActive,
              );
              const deleteAction = deletePrompt.bind(null, projectId, p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm ${
                        p.isActive
                          ? ""
                          : "text-neutral-400 line-through"
                      }`}
                    >
                      {p.promptText}
                    </div>
                    {p.tags ? (
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {p.tags}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className="text-xs rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        {p.isActive ? "Pause" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        className="text-xs rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
