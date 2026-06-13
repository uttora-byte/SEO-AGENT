"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSettings } from "@/lib/settings";

const settingsSchema = z.object({
  defaultProvider: z.enum([
    "claude-cli",
    "anthropic-api",
    "openai",
    "gemini",
    "perplexity",
  ]),
  defaultRegion: z.string().min(2).max(8),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  perplexityApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  serpapiKey: z.string().optional(),
  githubToken: z.string().optional(),
  githubOwner: z.string().optional(),
});

export async function saveSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsSchema.parse(raw);

  // Empty string = leave existing value alone. Sentinel "__clear__" = wipe.
  const patch: Record<string, string | null> = {
    defaultProvider: parsed.defaultProvider,
    defaultRegion: parsed.defaultRegion,
  };
  const secretFields = [
    "anthropicApiKey",
    "openaiApiKey",
    "perplexityApiKey",
    "googleApiKey",
    "serpapiKey",
    "githubToken",
  ] as const;
  for (const f of secretFields) {
    const v = parsed[f];
    if (v === "__clear__") patch[f] = null;
    else if (v && v.length > 0) patch[f] = v;
  }
  if (parsed.githubOwner !== undefined) {
    patch.githubOwner = parsed.githubOwner || null;
  }

  await updateSettings(patch);
  revalidatePath("/settings");
  revalidatePath("/");
}
