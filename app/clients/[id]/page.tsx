import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ClientForm } from "../_form";
import { updateClient, deleteClient } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId));
  if (!client) notFound();

  const clientProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.clientId, clientId));

  const updateAction = updateClient.bind(null, clientId);
  const deleteAction = deleteClient.bind(null, clientId);

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <Link href="/clients" className="text-sm text-neutral-500 hover:underline">
          ← All clients
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          {client.name}
        </h1>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Projects
        </h2>
        {clientProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
            No projects yet. Module-specific project creation (GEO / Programmatic
            / Local) comes online in Phase 1+.
          </div>
        ) : (
          <ul className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
            {clientProjects.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm flex justify-between">
                <span className="font-medium">{p.name}</span>
                <span className="text-neutral-500">{p.module}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Client details
        </h2>
        <ClientForm
          action={updateAction}
          defaults={client}
          submitLabel="Save changes"
        />
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
            Delete client and all projects
          </button>
        </form>
      </section>
    </div>
  );
}
