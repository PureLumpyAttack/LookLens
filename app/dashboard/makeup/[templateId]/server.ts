"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { makeupTemplates } from "@/lib/db/schema";

export async function rateTemplate({
  templateId,
  rating,
}: {
  templateId: string;
  rating: number;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clamped = Math.max(0, Math.min(5, Math.round(rating)));

  await db
    .update(makeupTemplates)
    .set({ rating: clamped })
    .where(
      and(
        eq(makeupTemplates.id, templateId),
        eq(makeupTemplates.ownerId, userId),
      ),
    );
}

export async function saveTemplate({ templateId }: { templateId: string }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(makeupTemplates)
    .set({ saved: true })
    .where(
      and(
        eq(makeupTemplates.id, templateId),
        eq(makeupTemplates.ownerId, userId),
      ),
    );
}

export async function deleteTemplate({ templateId }: { templateId: string }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(makeupTemplates)
    .where(
      and(
        eq(makeupTemplates.id, templateId),
        eq(makeupTemplates.ownerId, userId),
      ),
    );
}
