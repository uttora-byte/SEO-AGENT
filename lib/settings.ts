import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";
import type { Settings } from "./db/schema";

const DEFAULT_SETTINGS: Omit<Settings, "createdAt" | "updatedAt"> = {
  id: 1,
  defaultProvider: "claude-cli",
  defaultRegion: "US",
  anthropicApiKey: null,
  openaiApiKey: null,
  perplexityApiKey: null,
  googleApiKey: null,
  serpapiKey: null,
  githubToken: null,
  githubOwner: null,
};

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1));
  if (rows[0]) return rows[0];

  await db.insert(settings).values(DEFAULT_SETTINGS).onConflictDoNothing();
  const created = await db.select().from(settings).where(eq(settings.id, 1));
  return created[0]!;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id" | "createdAt" | "updatedAt">>,
): Promise<Settings> {
  await getSettings();
  await db
    .update(settings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(settings.id, 1));
  const rows = await db.select().from(settings).where(eq(settings.id, 1));
  return rows[0]!;
}

// Masked version safe to expose to client components — never send raw secrets
// to the browser, only whether each provider has a key configured.
export interface MaskedSettings {
  defaultProvider: string;
  defaultRegion: string;
  hasAnthropicApiKey: boolean;
  hasOpenaiApiKey: boolean;
  hasPerplexityApiKey: boolean;
  hasGoogleApiKey: boolean;
  hasSerpapiKey: boolean;
  hasGithubToken: boolean;
  githubOwner: string | null;
}

export async function getMaskedSettings(): Promise<MaskedSettings> {
  const s = await getSettings();
  return {
    defaultProvider: s.defaultProvider,
    defaultRegion: s.defaultRegion,
    hasAnthropicApiKey: Boolean(s.anthropicApiKey),
    hasOpenaiApiKey: Boolean(s.openaiApiKey),
    hasPerplexityApiKey: Boolean(s.perplexityApiKey),
    hasGoogleApiKey: Boolean(s.googleApiKey),
    hasSerpapiKey: Boolean(s.serpapiKey),
    hasGithubToken: Boolean(s.githubToken),
    githubOwner: s.githubOwner,
  };
}
