import { db } from "@/lib/db";
import { makeupTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { TemplateReadyView } from "./template-ready-view";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;

  if (!UUID_PATTERN.test(templateId)) {
    return notFound();
  }

  const template = await db.query.makeupTemplates.findFirst({
    where: eq(makeupTemplates.id, templateId),
    columns: {
      id: true,
      status: true,
    },
  });

  if (!template || template.status !== "ready") {
    return redirect(`/dashboard/makeup/${templateId}/processing`);
  }

  return <TemplateReadyView templateId={templateId} />;
}
