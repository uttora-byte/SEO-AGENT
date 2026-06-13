import Link from "next/link";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  churned: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export default async function ClientsPage() {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
            {rows.length} {rows.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          New client
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
          <p className="text-neutral-500 mb-4">No clients yet.</p>
          <Link
            href="/clients/new"
            className="text-sm font-medium underline"
          >
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Region</th>
                <th className="text-left px-4 py-3 font-medium">Industry</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium">
                      {c.name}
                    </Link>
                    {c.websiteUrl ? (
                      <div className="text-xs text-neutral-500">{c.websiteUrl}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{c.region}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {c.industry ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
