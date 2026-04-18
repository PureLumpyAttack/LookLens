import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { loadProcessingSnapshot } from "./data";
import { ProcessingView } from "./processing-view";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { userId } = await auth();
  const { templateId } = await params;

  if (!UUID_PATTERN.test(templateId)) {
    return notFound();
  }

  const snapshot = await loadProcessingSnapshot({
    ownerId: userId!,
    templateId,
  });

  if (!snapshot) {
    return notFound();
  }

  if (snapshot.templateStatus === "ready") {
    return redirect(`/dashboard/makeup/${templateId}`);
  }

  return (
    <ProcessingView
      templateId={templateId}
      displayImageUrl={snapshot.displayImageUrl}
      initialElapsedSeconds={snapshot.elapsedSeconds}
      templateName="Makeup Analysis"
      jobStatus={snapshot.jobStatus}
      activities={snapshot.activities}
    />
  );
}
