import "server-only";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoResults, geoRuns } from "@/lib/db/schema";

export interface ProviderShare {
  provider: string;
  totalResults: number;
  brandHits: number;
  brandRate: number; // 0..1
}

export interface CompetitorShare {
  name: string;
  hits: number;
  rate: number; // 0..1 across all results
}

export interface RunReport {
  totalResults: number;
  brandHits: number;
  brandRate: number;
  byProvider: ProviderShare[];
  competitors: CompetitorShare[];
}

export async function reportForRun(runId: number): Promise<RunReport> {
  const rows = await db
    .select()
    .from(geoResults)
    .where(eq(geoResults.runId, runId));
  return aggregate(rows);
}

export async function reportForProject(
  projectId: number,
  sinceDays = 7,
): Promise<RunReport & { runCount: number }> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const runs = await db
    .select({ id: geoRuns.id })
    .from(geoRuns)
    .where(
      and(
        eq(geoRuns.projectId, projectId),
        eq(geoRuns.status, "complete"),
        gte(geoRuns.startedAt, since),
      ),
    );
  if (runs.length === 0) {
    return {
      totalResults: 0,
      brandHits: 0,
      brandRate: 0,
      byProvider: [],
      competitors: [],
      runCount: 0,
    };
  }
  const rows = await db
    .select()
    .from(geoResults)
    .where(
      inArray(
        geoResults.runId,
        runs.map((r) => r.id),
      ),
    );
  return { ...aggregate(rows), runCount: runs.length };
}

type ResultRow = typeof geoResults.$inferSelect;

function aggregate(rows: ResultRow[]): RunReport {
  const totalResults = rows.length;
  let brandHits = 0;
  const providerMap = new Map<string, { total: number; hits: number }>();
  const competitorMap = new Map<string, number>();

  for (const r of rows) {
    if (r.brandCited) brandHits++;
    const p = providerMap.get(r.provider) ?? { total: 0, hits: 0 };
    p.total++;
    if (r.brandCited) p.hits++;
    providerMap.set(r.provider, p);

    const comps = safeParseStringArray(r.competitorsCitedJson);
    for (const c of comps) {
      competitorMap.set(c, (competitorMap.get(c) ?? 0) + 1);
    }
  }

  const byProvider: ProviderShare[] = Array.from(providerMap.entries())
    .map(([provider, v]) => ({
      provider,
      totalResults: v.total,
      brandHits: v.hits,
      brandRate: v.total > 0 ? v.hits / v.total : 0,
    }))
    .sort((a, b) => b.brandRate - a.brandRate);

  const competitors: CompetitorShare[] = Array.from(competitorMap.entries())
    .map(([name, hits]) => ({
      name,
      hits,
      rate: totalResults > 0 ? hits / totalResults : 0,
    }))
    .sort((a, b) => b.hits - a.hits);

  return {
    totalResults,
    brandHits,
    brandRate: totalResults > 0 ? brandHits / totalResults : 0,
    byProvider,
    competitors,
  };
}

function safeParseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
