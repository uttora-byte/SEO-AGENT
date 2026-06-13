"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { geoRuns } from "@/lib/db/schema";
import { startGeoRun } from "@/lib/geo/run";

export async function triggerGeoRun(projectId: number) {
  const summary = await startGeoRun(projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/report`);
  redirect(`/projects/${projectId}/runs/${summary.runId}`);
}

export async function deleteGeoRun(projectId: number, runId: number) {
  await db.delete(geoRuns).where(eq(geoRuns.id, runId));
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/report`);
  redirect(`/projects/${projectId}`);
}
