import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoPrompts, geoRuns, geoResults, projects } from "@/lib/db/schema";
import { getAvailableProviders } from "@/lib/providers";
import type { LLMProvider, ProviderId } from "@/lib/providers";
import { parseGeoConfig } from "./config";
import { detectCitations } from "./detect";

export interface RunSummary {
  runId: number;
  status: "complete" | "failed";
  providerIds: ProviderId[];
  promptCount: number;
  resultCount: number;
  brandHits: number;
  errors: Array<{ provider: ProviderId; promptId: number; message: string }>;
}

export async function startGeoRun(projectId: number): Promise<RunSummary> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (project.module !== "geo")
    throw new Error(`Project ${projectId} is not a GEO project`);

  const config = parseGeoConfig(project.configJson);
  if (!config || !config.brand.name) {
    throw new Error(
      "Project is missing brand configuration. Set the brand name before running.",
    );
  }

  const prompts = await db
    .select()
    .from(geoPrompts)
    .where(and(eq(geoPrompts.projectId, projectId), eq(geoPrompts.isActive, true)));
  if (prompts.length === 0) {
    throw new Error("No active prompts. Add prompts before running.");
  }

  const providers = await getAvailableProviders();
  if (providers.length === 0) {
    throw new Error(
      "No LLM providers configured. Add at least one API key in Settings (or install the Claude Code CLI).",
    );
  }

  const [run] = await db
    .insert(geoRuns)
    .values({ projectId, status: "running" })
    .returning({ id: geoRuns.id });

  const errors: RunSummary["errors"] = [];
  let brandHits = 0;
  let resultCount = 0;

  // Parallel across providers; sequential per provider to be polite to rate
  // limits. Provider failures don't abort the run — they're recorded and the
  // other engines continue.
  const work = providers.map(async (provider) => {
    for (const prompt of prompts) {
      try {
        const result = await callProvider(provider, prompt.promptText);
        const detection = detectCitations(result.text, config);
        await db.insert(geoResults).values({
          runId: run.id,
          promptId: prompt.id,
          provider: provider.id,
          model: result.model,
          responseText: result.text,
          brandCited: detection.brandCited,
          competitorsCitedJson: JSON.stringify(detection.competitorsCited),
          sourcesJson: JSON.stringify(result.sources ?? []),
        });
        resultCount++;
        if (detection.brandCited) brandHits++;
      } catch (err) {
        errors.push({
          provider: provider.id,
          promptId: prompt.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  });

  try {
    await Promise.all(work);
    await db
      .update(geoRuns)
      .set({
        status: "complete",
        finishedAt: new Date(),
        errorMessage: errors.length > 0 ? summarizeErrors(errors) : null,
      })
      .where(eq(geoRuns.id, run.id));
    return {
      runId: run.id,
      status: "complete",
      providerIds: providers.map((p) => p.id),
      promptCount: prompts.length,
      resultCount,
      brandHits,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(geoRuns)
      .set({ status: "failed", finishedAt: new Date(), errorMessage: message })
      .where(eq(geoRuns.id, run.id));
    return {
      runId: run.id,
      status: "failed",
      providerIds: providers.map((p) => p.id),
      promptCount: prompts.length,
      resultCount,
      brandHits,
      errors,
    };
  }
}

async function callProvider(provider: LLMProvider, prompt: string) {
  // GEO measurement is about how the engine answers a user-style question
  // with no extra context, so no system prompt and no temperature override.
  return provider.generate(prompt);
}

function summarizeErrors(errors: RunSummary["errors"]): string {
  const byProvider = new Map<string, number>();
  for (const e of errors) {
    byProvider.set(e.provider, (byProvider.get(e.provider) ?? 0) + 1);
  }
  return Array.from(byProvider.entries())
    .map(([p, n]) => `${p}: ${n} error${n === 1 ? "" : "s"}`)
    .join("; ");
}
