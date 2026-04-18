import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  makeupProcessingActivities,
  makeupProcessingJobs,
  makeupTemplates,
} from "@/lib/db/schema";
import { decryptText } from "@/lib/encryption";

export type ProcessingActivityView = {
  id: string;
  kind: "research" | "adversarial" | "rebuttal" | "finalize";
  title: string;
  description: string | null;
  status: "pending" | "running" | "completed" | "failed";
  payload: Array<{
    label: string;
    detail: string;
  }>;
};

export type ProcessingSnapshot = {
  templateId: string;
  templateStatus: "processing" | "ready" | "failed";
  displayImageUrl: string | null;
  elapsedSeconds: number;
  jobStatus: "queued" | "processing" | "completed" | "failed";
  activities: ProcessingActivityView[];
};

export async function loadProcessingSnapshot({
  ownerId,
  templateId,
}: {
  ownerId: string;
  templateId: string;
}): Promise<ProcessingSnapshot | null> {
  const [template] = await db
    .select({
      id: makeupTemplates.id,
      status: makeupTemplates.status,
      generatedPreviewPhoto: makeupTemplates.generatedPreviewPhoto,
    })
    .from(makeupTemplates)
    .where(
      and(eq(makeupTemplates.id, templateId), eq(makeupTemplates.ownerId, ownerId)),
    )
    .limit(1);

  if (!template) {
    return null;
  }

  const [job] = await db
    .select({
      id: makeupProcessingJobs.id,
      status: makeupProcessingJobs.status,
      elapsedSeconds: makeupProcessingJobs.elapsedSeconds,
      startedAt: makeupProcessingJobs.startedAt,
      sourcePhotoUrl: makeupProcessingJobs.sourcePhotoUrl,
    })
    .from(makeupProcessingJobs)
    .where(
      and(
        eq(makeupProcessingJobs.templateId, templateId),
        eq(makeupProcessingJobs.ownerId, ownerId),
      ),
    )
    .orderBy(desc(makeupProcessingJobs.createdAt))
    .limit(1);

  if (!job) {
    return null;
  }

  const activities = await db
    .select({
      id: makeupProcessingActivities.id,
      kind: makeupProcessingActivities.kind,
      title: makeupProcessingActivities.title,
      description: makeupProcessingActivities.description,
      status: makeupProcessingActivities.status,
      payload: makeupProcessingActivities.payload,
    })
    .from(makeupProcessingActivities)
    .where(eq(makeupProcessingActivities.jobId, job.id))
    .orderBy(asc(makeupProcessingActivities.sequence));

  const sourcePhotoUrl = resolveImageUrl(job.sourcePhotoUrl);
  const generatedPreviewPhotoUrl = resolveImageUrl(
    template.generatedPreviewPhoto,
  );
  const elapsedSeconds =
    job.status === "processing" && job.startedAt
      ? Math.max(
          job.elapsedSeconds,
          Math.floor((Date.now() - job.startedAt.getTime()) / 1000),
        )
      : job.elapsedSeconds;

  const activeActivity = activities.find((activity) => activity.status === "running");
  const shouldShowGeneratedPreview =
    (!!generatedPreviewPhotoUrl &&
      (!activeActivity ||
        !["research", "adversarial", "rebuttal"].includes(activeActivity.kind))) ||
    template.status === "ready";

  return {
    templateId,
    templateStatus: template.status,
    displayImageUrl: shouldShowGeneratedPreview
      ? generatedPreviewPhotoUrl
      : sourcePhotoUrl,
    elapsedSeconds,
    jobStatus: job.status,
    activities: activities.map((activity) => ({
      id: activity.id,
      kind: activity.kind,
      title: activity.title,
      description: activity.description,
      status: activity.status,
      payload: normalizePayload(activity.payload),
    })),
  };
}

function resolveImageUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decryptText(value);
  } catch {
    return value;
  }
}

function normalizePayload(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "detail" in item &&
      typeof item.label === "string" &&
      typeof item.detail === "string"
    ) {
      return [{ label: item.label, detail: item.detail }];
    }

    return [];
  });
}
