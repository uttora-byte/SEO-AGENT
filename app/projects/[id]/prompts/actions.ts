"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoPrompts } from "@/lib/db/schema";
import { parseLines } from "@/lib/geo/config";

const addSchema = z.object({
  prompts: z.string().min(1),
  tags: z.string().optional(),
});

export async function addPrompts(projectId: number, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = addSchema.parse(raw);

  const lines = parseLines(parsed.prompts);
  if (lines.length === 0) return;

  const tags = parsed.tags?.trim() || null;
  await db.insert(geoPrompts).values(
    lines.map((promptText) => ({
      projectId,
      promptText,
      tags,
      isActive: true,
    })),
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/prompts`);
}

export async function togglePrompt(
  projectId: number,
  promptId: number,
  nextActive: boolean,
) {
  await db
    .update(geoPrompts)
    .set({ isActive: nextActive, updatedAt: new Date() })
    .where(eq(geoPrompts.id, promptId));
  revalidatePath(`/projects/${projectId}/prompts`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deletePrompt(projectId: number, promptId: number) {
  await db.delete(geoPrompts).where(eq(geoPrompts.id, promptId));
  revalidatePath(`/projects/${projectId}/prompts`);
  revalidatePath(`/projects/${projectId}`);
}
