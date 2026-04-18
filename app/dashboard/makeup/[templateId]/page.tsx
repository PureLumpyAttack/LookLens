import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { makeupTemplates } from "@/lib/db/schema";
import { decryptText } from "@/lib/encryption";
import { notFound, redirect } from "next/navigation";
import { TemplateReadyView } from "./template-ready-view";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StoredProduct = {
  category?: string;
  originalProductName?: string;
  originalBrand?: string;
  shadeDescription?: string;
  dupeBrand?: string;
  dupeProductName?: string;
  dupePriceCad?: number;
  whereToBuy?: string;
};

function resolveImageUrl(value: string | null) {
  if (!value) return null;
  try {
    return decryptText(value);
  } catch {
    return value;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { userId } = await auth();
  const { templateId } = await params;

  if (!UUID_PATTERN.test(templateId)) {
    return notFound();
  }

  const template = await db.query.makeupTemplates.findFirst({
    where: and(
      eq(makeupTemplates.id, templateId),
      eq(makeupTemplates.ownerId, userId!)
    ),
  });

  if (!template) {
    return notFound();
  }

  if (template.status !== "ready") {
    return redirect(`/dashboard/makeup/${templateId}/processing`);
  }

  const products = Array.isArray(template.products)
    ? (template.products as StoredProduct[]).map((product, index) => ({
        id: `${templateId}-product-${index}`,
        name:
          [product.dupeBrand, product.dupeProductName]
            .filter(Boolean)
            .join(" ") ||
          product.originalProductName ||
          product.category ||
          "Product",
        price:
          typeof product.dupePriceCad === "number"
            ? `$${product.dupePriceCad.toFixed(2)}`
            : "",
      }))
    : [];

  const steps = template.makeupInstructions
    ? template.makeupInstructions
        .split(/\n+/)
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
    : [];

  return (
    <TemplateReadyView
      templateId={templateId}
      name={template.name ?? "Makeup Look"}
      previewImageUrl={resolveImageUrl(template.generatedPreviewPhoto)}
      products={products}
      steps={steps}
      initialRating={template.rating ?? 0}
    />
  );
}
