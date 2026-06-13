"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const clientSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  region: z.string().min(2).max(8),
  industry: z.string().max(200).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["active", "paused", "churned"]).default("active"),
});

export async function createClient(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = clientSchema.parse(raw);

  const [inserted] = await db
    .insert(clients)
    .values({
      name: parsed.name,
      websiteUrl: parsed.websiteUrl || null,
      region: parsed.region,
      industry: parsed.industry || null,
      contactEmail: parsed.contactEmail || null,
      notes: parsed.notes || null,
      status: parsed.status,
    })
    .returning({ id: clients.id });

  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${inserted.id}`);
}

export async function updateClient(id: number, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = clientSchema.parse(raw);

  await db
    .update(clients)
    .set({
      name: parsed.name,
      websiteUrl: parsed.websiteUrl || null,
      region: parsed.region,
      industry: parsed.industry || null,
      contactEmail: parsed.contactEmail || null,
      notes: parsed.notes || null,
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

export async function deleteClient(id: number) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}
