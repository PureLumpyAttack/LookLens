"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";

import { db } from "@/lib/db";
import {
  makeupProcessingActivities,
  makeupProcessingJobs,
  makeupTemplates,
} from "@/lib/db/schema";
import { encryptText } from "@/lib/encryption";
import { runMakeupProcessingPipeline } from "@/lib/makeup-pipeline";

type CreateProcessingTemplateInput = {
  sourcePhotoUrl: string;
  sourcePhotoKey?: string | null;
};

export async function createProcessingTemplate({
  sourcePhotoUrl,
  sourcePhotoKey,
}: CreateProcessingTemplateInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!sourcePhotoUrl) {
    throw new Error("A source photo is required");
  }

  let templateId: string | null = null;

  try {
    const [template] = await db
      .insert(makeupTemplates)
      .values({
        ownerId: userId,
        status: "processing",
      })
      .returning({ id: makeupTemplates.id });

    templateId = template.id;

    const [job] = await db
      .insert(makeupProcessingJobs)
      .values({
        ownerId: userId,
        templateId: template.id,
        sourcePhotoUrl: encryptText(sourcePhotoUrl),
        sourcePhotoKey: sourcePhotoKey ?? null,
        status: "processing",
        currentStage: "research",
        elapsedSeconds: 0,
        startedAt: new Date(),
      })
      .returning({ id: makeupProcessingJobs.id });

    await db.insert(makeupProcessingActivities).values([
      {
        jobId: job.id,
        kind: "research",
        title: "Main Researcher Agent",
        description: "Identify the makeup used and the cheapest reproduction.",
        status: "running",
        sequence: 1,
        payload: [
          {
            label: "image.ingest",
            detail: "Uploaded reference photo accepted for processing",
          },
        ],
        startedAt: new Date(),
      },
      {
        jobId: job.id,
        kind: "adversarial",
        title: "Adversarial Agent",
        description: "Contest findings for health risks and cost issues.",
        status: "pending",
        sequence: 2,
        payload: [],
      },
      {
        jobId: job.id,
        kind: "rebuttal",
        title: "Rebuttal check",
        description: "If there is a rebuttal, loop back to the researcher.",
        status: "pending",
        sequence: 3,
        payload: [],
      },
      {
        jobId: job.id,
        kind: "finalize",
        title: "Finalize result",
        description: "Assemble products, steps, and cost summary.",
        status: "pending",
        sequence: 4,
        payload: [],
      },
    ]);

    after(async () => {
      try {
        await runMakeupProcessingPipeline({
          templateId: template.id,
          jobId: job.id,
        });
      } catch (error) {
        console.error("Failed to run makeup processing pipeline", error);
      }
    });

    return {
      templateId: template.id,
      jobId: job.id,
    };
  } catch (error) {
    if (templateId) {
      await db
        .delete(makeupTemplates)
        .where(eq(makeupTemplates.id, templateId));
    }

    throw error;
  }
}

export async function deleteSavedTemplate({ templateId }: { templateId: string }) {
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
