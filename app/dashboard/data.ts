import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { makeupTemplates } from "@/lib/db/schema";
import { decryptText } from "@/lib/encryption";

export type SavedMakeupView = {
  id: string;
  name: string;
  rating: number;
  price: string;
  previewImageUrl: string | null;
};

function resolveImageUrl(value: string | null) {
  if (!value) return null;
  try {
    return decryptText(value);
  } catch {
    return value;
  }
}

export async function loadSavedMakeups(
  ownerId: string,
): Promise<SavedMakeupView[]> {
  const rows = await db
    .select({
      id: makeupTemplates.id,
      name: makeupTemplates.name,
      rating: makeupTemplates.rating,
      inferredCost: makeupTemplates.inferredCost,
      generatedPreviewPhoto: makeupTemplates.generatedPreviewPhoto,
      createdAt: makeupTemplates.createdAt,
    })
    .from(makeupTemplates)
    .where(
      and(
        eq(makeupTemplates.ownerId, ownerId),
        eq(makeupTemplates.saved, true),
        eq(makeupTemplates.status, "ready"),
      ),
    )
    .orderBy(desc(makeupTemplates.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Makeup Look",
    rating: row.rating ?? 0,
    price:
      typeof row.inferredCost === "number"
        ? `$${row.inferredCost.toFixed(2)}`
        : "",
    previewImageUrl: resolveImageUrl(row.generatedPreviewPhoto),
  }));
}
