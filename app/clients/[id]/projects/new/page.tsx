import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGeoProject } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) notFound();

  const action = createGeoProject.bind(null, clientId);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          href={`/clients/${clientId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {client.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          New GEO project
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track how AI search engines cite this client&apos;s brand against
          competitors. Programmatic SEO and Local SEO project types come online
          in later phases.
        </p>
      </div>

      <form action={action} className="space-y-5">
        <Field label="Project name" required>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Q3 GEO tracking"
            className={inputCls}
          />
        </Field>

        <Field label="Brand name" required hint="Exact name to search for in AI responses.">
          <input
            type="text"
            name="brandName"
            required
            defaultValue={client.name}
            className={inputCls}
          />
        </Field>

        <Field
          label="Brand aliases"
          hint="One per line. Other ways the brand might be written (parent company, abbreviation, product names)."
        >
          <textarea
            name="brandAliases"
            rows={3}
            placeholder={"e.g.\nAcme Corp\nAcme.io"}
            className={inputCls}
          />
        </Field>

        <Field
          label="Competitors"
          hint="One per line. Brands to compare share-of-voice against."
        >
          <textarea
            name="competitors"
            rows={5}
            placeholder={"e.g.\nCompetitor A\nCompetitor B\nCompetitor C"}
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Create project
        </button>
      </form>
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
