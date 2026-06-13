import { z } from "zod";

const competitorSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
});

export const geoConfigSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    aliases: z.array(z.string()).default([]),
  }),
  competitors: z.array(competitorSchema).default([]),
});

export type GeoConfig = z.infer<typeof geoConfigSchema>;
export type GeoCompetitor = z.infer<typeof competitorSchema>;

export function parseGeoConfig(raw: string | null | undefined): GeoConfig | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const parsed = geoConfigSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serializeGeoConfig(config: GeoConfig): string {
  return JSON.stringify(config);
}

export function emptyGeoConfig(): GeoConfig {
  return { brand: { name: "", aliases: [] }, competitors: [] };
}

export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
