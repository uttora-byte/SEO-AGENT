"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import {
  geoConfigSchema,
  parseLines,
  serializeGeoConfig,
} from "@/lib/geo/config";

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  brandName: z.string().min(1).max(200),
  brandAliases: z.string().optional().default(""),
  competitors: z.string().optional().default(""),
  status: z.enum(["active", "paused", "archived"]).default("active"),
});

export async function updateGeoProject(projectId: number, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateSchema.parse(raw);

  const config = geoConfigSchema.parse({
    brand: {
      name: parsed.brandName,
      aliases: parseLines(parsed.brandAliases),
    },
    competitors: parseLines(parsed.competitors).map((name) => ({
      name,
      aliases: [],
    })),
  });

  await db
    .update(projects)
    .set({
      name: parsed.name,
      configJson: serializeGeoConfig(config),
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/clients");
}

export async function deleteGeoProject(projectId: number) {
  const [project] = await db
    .select({ clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.id, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/");
  if (project) {
    revalidatePath(`/clients/${project.clientId}`);
    redirect(`/clients/${project.clientId}`);
  }
  redirect("/clients");
}
