"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import {
  geoConfigSchema,
  parseLines,
  serializeGeoConfig,
} from "@/lib/geo/config";

const geoProjectSchema = z.object({
  name: z.string().min(1).max(200),
  brandName: z.string().min(1).max(200),
  brandAliases: z.string().optional().default(""),
  competitors: z.string().optional().default(""),
});

export async function createGeoProject(clientId: number, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = geoProjectSchema.parse(raw);

  const competitorNames = parseLines(parsed.competitors);
  const config = geoConfigSchema.parse({
    brand: {
      name: parsed.brandName,
      aliases: parseLines(parsed.brandAliases),
    },
    competitors: competitorNames.map((name) => ({ name, aliases: [] })),
  });

  const [inserted] = await db
    .insert(projects)
    .values({
      clientId,
      name: parsed.name,
      module: "geo",
      configJson: serializeGeoConfig(config),
      status: "active",
    })
    .returning({ id: projects.id });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/projects/${inserted.id}`);
}
