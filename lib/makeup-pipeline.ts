import "server-only";

import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  makeupProcessingActivities,
  makeupProcessingJobs,
  makeupTemplates,
  users,
} from "@/lib/db/schema";
import { decryptText, encryptText } from "@/lib/encryption";

type ResearchProduct = {
  category: string;
  originalProductName: string;
  originalBrand: string;
  shadeDescription: string;
  dupeBrand: string;
  dupeProductName: string;
  dupePriceCad: number;
  whereToBuy: string;
  qualityScore: number;
  confidence: "high" | "medium" | "low";
};

type ResearchResult = {
  lookName: string;
  rationaleSummary: string;
  totalEstimatedCostCad: number;
  products: ResearchProduct[];
};

type RebuttalConcern = {
  type: "health" | "cost" | "accuracy" | "missing";
  summary: string;
  recommendation: string;
};

type RebuttalResult = {
  hasRebuttal: boolean;
  verdict: string;
  concerns: RebuttalConcern[];
};

type InstructionStep = {
  order: number;
  productName: string;
  tool: string;
  technique: string;
  blendingTip: string;
};

type InstructionsResult = {
  steps: InstructionStep[];
};

type ModelRunResult<T> = {
  result: T;
  thoughts: string[];
};

type StreamCallbacks = {
  onThoughtUpdate?: (thoughtText: string) => Promise<void> | void;
  onAnswerUpdate?: (answerText: string) => Promise<void> | void;
};

type ActivityPayload = {
  label: string;
  detail: string;
};

type GoogleGenAIClient = {
  models: {
    generateContentStream(input: unknown): AsyncIterable<unknown>;
  };
};

type PipelineContext = {
  templateId: string;
  jobId: string;
  ownerId: string;
  budgetCad: number;
  userFacePhotoUrl: string;
  referencePhotoUrl: string;
};

const utapi = new UTApi();

const textTools = [{ googleSearch: {} }];
const imageTools = [{ googleSearch: { searchTypes: { webSearch: {} } } }];
const confidenceValues = ["high", "medium", "low"] as const;
const rebuttalConcernTypes = ["health", "cost", "accuracy", "missing"] as const;

const researchProductSchema = z.object({
  category: z.string().trim().min(1),
  originalProductName: z.string().trim().min(1),
  originalBrand: z.string().trim().min(1),
  shadeDescription: z.string().trim().min(1),
  dupeBrand: z.string().trim().min(1),
  dupeProductName: z.string().trim().min(1),
  dupePriceCad: z.coerce.number().nonnegative(),
  whereToBuy: z.string().trim().min(1),
  qualityScore: z.coerce.number().min(1).max(10),
  confidence: z.enum(confidenceValues),
});

const researchResultSchema = z.object({
  lookName: z.string().trim().min(1),
  rationaleSummary: z.string().trim().min(1),
  totalEstimatedCostCad: z.coerce.number().nonnegative().optional().default(0),
  products: z.array(researchProductSchema).min(1),
});

const rebuttalConcernSchema = z.object({
  type: z.enum(rebuttalConcernTypes),
  summary: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
});

const rebuttalResultSchema = z.object({
  hasRebuttal: z.boolean(),
  verdict: z.string().trim().min(1),
  concerns: z.array(rebuttalConcernSchema),
});

const instructionStepSchema = z.object({
  order: z.coerce.number().int().positive(),
  productName: z.string().trim().min(1),
  tool: z.string().trim().min(1),
  technique: z.string().trim().min(1),
  blendingTip: z.string().trim().min(1),
});

const instructionsResultSchema = z.object({
  steps: z.array(instructionStepSchema).min(1),
});

export async function runMakeupProcessingPipeline({
  templateId,
  jobId,
}: {
  templateId: string;
  jobId: string;
}) {
  const ai = await getGoogleGenAIClient();
  const startedAt = Date.now();
  let activeStage: "research" | "adversarial" | "rebuttal" | "finalize" =
    "research";

  try {
    const context = await loadPipelineContext({ templateId, jobId });
    const researchBasePayload: ActivityPayload[] = [];

    await setJobState(jobId, {
      status: "processing",
      currentStage: "research",
      startedAt: new Date(),
      elapsedSeconds: 0,
      errorMessage: null,
    });

    await updateActivity("research", jobId, {
      status: "running",
      startedAt: new Date(),
      payload: researchBasePayload,
    });

    let researchRun = await researchLook(ai, context, [], {
      onThoughtUpdate: async (thoughtText) => {
        await updateActivity("research", jobId, {
          status: "running",
          payload: buildLivePayload(
            researchBasePayload,
            "research.thought.live",
            thoughtText,
          ),
        });
      },
    });
    let researchResult = researchRun.result;
    let researchPayload = buildResearchPayload(
      researchResult,
      1,
      researchRun.thoughts,
    );

    await updateActivity("research", jobId, {
      status: "completed",
      completedAt: new Date(),
      payload: researchPayload,
    });

    let rebuttalResult: RebuttalResult | null = null;

    for (let round = 1; round <= 2; round += 1) {
      activeStage = "adversarial";
      const adversarialBasePayload: ActivityPayload[] = [
        {
          label: "adversarial.pass",
          detail: `Auditing round ${round} for pricing, safety, and missing products.`,
        },
      ];
      await setJobState(jobId, {
        currentStage: "adversarial",
      });

      await updateActivity("adversarial", jobId, {
        status: "running",
        startedAt: round === 1 ? new Date() : undefined,
        payload: adversarialBasePayload,
      });

      const rebuttalRun = await rebuttalLook(
        ai,
        context,
        researchResult,
        round,
        {
          onThoughtUpdate: async (thoughtText) => {
            await updateActivity("adversarial", jobId, {
              status: "running",
              payload: buildLivePayload(
                adversarialBasePayload,
                "adversarial.thought.live",
                thoughtText,
              ),
            });
          },
        },
      );
      rebuttalResult = rebuttalRun.result;

      await updateActivity("adversarial", jobId, {
        status: "completed",
        completedAt: new Date(),
        payload: buildRebuttalPayload(rebuttalResult, rebuttalRun.thoughts),
      });

      activeStage = "rebuttal";
      await setJobState(jobId, {
        currentStage: "rebuttal",
      });

      if (!rebuttalResult.hasRebuttal) {
        await updateActivity("rebuttal", jobId, {
          status: "completed",
          startedAt: new Date(),
          completedAt: new Date(),
          payload: [
            ...formatThoughtPayload(rebuttalRun.thoughts, "rebuttal.thought"),
            {
              label: "rebuttal.result",
              detail: "No actionable rebuttal. Findings look good.",
            },
          ],
        });
        break;
      }

      const rebuttalPayload = [
        ...formatThoughtPayload(rebuttalRun.thoughts, "rebuttal.thought"),
        {
          label: "rebuttal.loop",
          detail: `Round ${round} surfaced concerns significant enough to send the researcher back for revisions.`,
        },
        ...rebuttalResult.concerns.map((concern, index) => ({
          label: `contested.finding.${index + 1}`,
          detail: `${concern.type}: ${concern.summary}`,
        })),
      ];

      await updateActivity("rebuttal", jobId, {
        status: round === 2 ? "completed" : "running",
        startedAt: round === 1 ? new Date() : undefined,
        completedAt: round === 2 ? new Date() : undefined,
        payload: rebuttalPayload,
      });

      activeStage = "research";
      await setJobState(jobId, {
        currentStage: "research",
      });

      await updateActivity("research", jobId, {
        status: "running",
        payload: buildLivePayload(
          [
            ...researchBasePayload,
            {
              label: "rebuttal.apply",
              detail: `Applying rebuttal feedback from round ${round}`,
            },
          ],
          "research.thought.live",
          "",
        ),
      });

      researchRun = await researchLook(
        ai,
        context,
        rebuttalResult.concerns.map(
          (concern) =>
            `${concern.type}: ${concern.summary}. ${concern.recommendation}`,
        ),
        {
          onThoughtUpdate: async (thoughtText) => {
            await updateActivity("research", jobId, {
              status: "running",
              payload: buildLivePayload(
                [
                  ...researchBasePayload,
                  {
                    label: "rebuttal.apply",
                    detail: `Applying rebuttal feedback from round ${round}`,
                  },
                ],
                "research.thought.live",
                thoughtText,
              ),
            });
          },
        },
      );
      researchResult = researchRun.result;
      researchPayload = buildResearchPayload(
        researchResult,
        round + 1,
        researchRun.thoughts,
      );

      await updateActivity("research", jobId, {
        status: "completed",
        completedAt: new Date(),
        payload: researchPayload,
      });

      if (!rebuttalResult.hasRebuttal || round === 2) {
        await updateActivity("rebuttal", jobId, {
          status: "completed",
          completedAt: new Date(),
          payload: [
            ...rebuttalPayload,
            {
              label: "rebuttal.result",
              detail:
                round === 2
                  ? "Final revision applied. Proceeding with best-effort result."
                  : "Rebuttal concerns addressed.",
            },
          ],
        });
        break;
      }
    }

    activeStage = "finalize";
    const finalizeBasePayload: ActivityPayload[] = [
      {
        label: "finalize.compose",
        detail: "Building instructions and generated preview",
      },
    ];
    await setJobState(jobId, {
      currentStage: "finalize",
    });

    await updateActivity("finalize", jobId, {
      status: "running",
      startedAt: new Date(),
      payload: finalizeBasePayload,
    });

    const instructionsRun = await createInstructions(ai, researchResult, {
      onThoughtUpdate: async (thoughtText) => {
        await updateActivity("finalize", jobId, {
          status: "running",
          payload: buildLivePayload(
            finalizeBasePayload,
            "finalize.thought.live",
            thoughtText,
          ),
        });
      },
    });
    const instructions = instructionsRun.result;
    const generatedPreviewPhoto = await createPreviewImage({
      ai,
      userFacePhotoUrl: context.userFacePhotoUrl,
      referencePhotoUrl: context.referencePhotoUrl,
      products: researchResult.products,
      templateId,
    });

    if (generatedPreviewPhoto) {
      await db
        .update(makeupTemplates)
        .set({
          generatedPreviewPhoto: encryptText(generatedPreviewPhoto),
        })
        .where(eq(makeupTemplates.id, templateId));

      await updateActivity("finalize", jobId, {
        status: "running",
        payload: [
          ...formatThoughtPayload(instructionsRun.thoughts, "finalize.thought"),
          {
            label: "instruction.compose",
            detail: `${instructions.steps.length} beginner-friendly steps drafted`,
          },
          {
            label: "preview.render",
            detail: "Generated try-on preview uploaded",
          },
        ],
      });
    }

    await db
      .update(makeupTemplates)
      .set({
        status: "ready",
        name: researchResult.lookName,
        inferredCost: researchResult.totalEstimatedCostCad,
        makeupInstructions: formatInstructions(instructions),
        products: researchResult.products,
      })
      .where(eq(makeupTemplates.id, templateId));

    await updateActivity("finalize", jobId, {
      status: "completed",
      completedAt: new Date(),
      payload: [
        ...formatThoughtPayload(instructionsRun.thoughts, "finalize.thought"),
        {
          label: "instruction.steps",
          detail: `${instructions.steps.length} beginner-friendly steps drafted`,
        },
        {
          label: "preview.render",
          detail: generatedPreviewPhoto
            ? "Generated try-on preview uploaded"
            : "Preview skipped",
        },
        {
          label: "cost.total",
          detail: `Estimated total: $${researchResult.totalEstimatedCostCad.toFixed(
            2,
          )} CAD`,
        },
      ],
    });

    await setJobState(jobId, {
      status: "completed",
      currentStage: "finalize",
      completedAt: new Date(),
      elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected processing error";

    await db
      .update(makeupTemplates)
      .set({
        status: "failed",
      })
      .where(eq(makeupTemplates.id, templateId));

    await setJobState(jobId, {
      status: "failed",
      currentStage: activeStage,
      completedAt: new Date(),
      elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
      errorMessage: message,
    });

    await updateActivity(activeStage, jobId, {
      status: "failed",
      completedAt: new Date(),
      payload: [
        {
          label: "pipeline.error",
          detail: message,
        },
      ],
    });

    throw error;
  }
}

async function loadPipelineContext({
  templateId,
  jobId,
}: {
  templateId: string;
  jobId: string;
}): Promise<PipelineContext> {
  const [job] = await db
    .select({
      id: makeupProcessingJobs.id,
      ownerId: makeupProcessingJobs.ownerId,
      templateId: makeupProcessingJobs.templateId,
      sourcePhotoUrl: makeupProcessingJobs.sourcePhotoUrl,
      ownerBudget: users.maxBudget,
      userFacePhoto: users.userRealPhoto,
    })
    .from(makeupProcessingJobs)
    .innerJoin(users, eq(users.userId, makeupProcessingJobs.ownerId))
    .where(
      and(
        eq(makeupProcessingJobs.id, jobId),
        eq(makeupProcessingJobs.templateId, templateId),
      ),
    )
    .limit(1);

  if (!job) {
    throw new Error("Processing job not found");
  }

  if (!job.userFacePhoto) {
    throw new Error("User face photo is required for preview generation");
  }

  return {
    templateId: job.templateId,
    jobId: job.id,
    ownerId: job.ownerId,
    budgetCad: job.ownerBudget && job.ownerBudget > 0 ? job.ownerBudget : 200,
    userFacePhotoUrl: resolveMaybeEncryptedText(job.userFacePhoto),
    referencePhotoUrl: resolveMaybeEncryptedText(job.sourcePhotoUrl),
  };
}

async function researchLook(
  ai: GoogleGenAIClient,
  context: PipelineContext,
  rebuttalNotes: string[] = [],
  callbacks: StreamCallbacks = {},
): Promise<ModelRunResult<ResearchResult>> {
  const groundedResponse = await ai.models.generateContentStream({
    model: "gemma-4-31b-it",
    config: {
      tools: textTools,
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "HIGH",
      },
    } as never,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildResearchPrompt(context.budgetCad, rebuttalNotes) },
          { text: "Reference look (what to recreate):" },
          await imagePartFromUrl(context.referencePhotoUrl),
          { text: "User's face photo (who will wear the makeup):" },
          await imagePartFromUrl(context.userFacePhotoUrl),
        ],
      },
    ],
  });

  const streamed = await readTextAndThoughtStream(groundedResponse, callbacks);

  const parsed = await formatStructuredJson(
    ai,
    buildResearchFormatterPrompt(streamed.answerText, context.budgetCad),
    researchResponseSchema,
    researchResultSchema,
  );

  return {
    thoughts: splitThoughtSummaries(streamed.thoughtText),
    result: {
      ...parsed,
      totalEstimatedCostCad: normalizeCurrency(
        parsed.totalEstimatedCostCad ??
          parsed.products.reduce(
            (total, product) => total + product.dupePriceCad,
            0,
          ),
      ),
      products: parsed.products.map((product) => ({
        ...product,
        dupePriceCad: normalizeCurrency(product.dupePriceCad),
      })),
    },
  };
}

async function rebuttalLook(
  ai: GoogleGenAIClient,
  context: PipelineContext,
  research: ResearchResult,
  round: number,
  callbacks: StreamCallbacks = {},
): Promise<ModelRunResult<RebuttalResult>> {
  const groundedResponse = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    config: {
      tools: textTools,
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "HIGH",
      },
    } as never,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildRebuttalPrompt(context.budgetCad, research, round) },
          { text: "Reference look (what to recreate):" },
          await imagePartFromUrl(context.referencePhotoUrl),
          { text: "User's face photo (who will wear the makeup):" },
          await imagePartFromUrl(context.userFacePhotoUrl),
        ],
      },
    ],
  });

  const streamed = await readTextAndThoughtStream(groundedResponse, callbacks);

  const parsed = await formatStructuredJson(
    ai,
    buildRebuttalFormatterPrompt(streamed.answerText),
    rebuttalResponseSchema,
    rebuttalResultSchema,
  );

  return {
    thoughts: splitThoughtSummaries(streamed.thoughtText),
    result: parsed,
  };
}

async function createInstructions(
  ai: GoogleGenAIClient,
  research: ResearchResult,
  callbacks: StreamCallbacks = {},
): Promise<ModelRunResult<InstructionsResult>> {
  const response = await ai.models.generateContentStream({
    model: "gemma-4-31b-it",
    config: {
      responseMimeType: "application/json",
      responseSchema: instructionsResponseSchema,
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "HIGH",
      },
    } as never,
    contents: [
      {
        role: "user",
        parts: [{ text: buildInstructionsPrompt(research) }],
      },
    ],
  });

  const streamed = await readTextAndThoughtStream(response, callbacks);

  return {
    thoughts: splitThoughtSummaries(streamed.thoughtText),
    result: parseJsonWithSchema(streamed.answerText, instructionsResultSchema),
  };
}

async function formatStructuredJson<T>(
  ai: GoogleGenAIClient,
  prompt: string,
  responseSchema: unknown,
  zodSchema: z.ZodType<T>,
): Promise<T> {
  const response = await ai.models.generateContentStream({
    model: "gemma-4-31b-it",
    config: {
      responseMimeType: "application/json",
      responseSchema,
      thinkingConfig: {
        thinkingLevel: "MINIMAL",
      },
    } as never,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const streamed = await readTextAndThoughtStream(response);
  return parseJsonWithSchema(streamed.answerText, zodSchema);
}

async function createPreviewImage({
  ai,
  userFacePhotoUrl,
  referencePhotoUrl,
  products,
  templateId,
}: {
  ai: GoogleGenAIClient;
  userFacePhotoUrl: string;
  referencePhotoUrl: string;
  products: ResearchProduct[];
  templateId: string;
}) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3.1-flash-image-preview",
    config: {
      tools: imageTools,
      thinkingConfig: {
        thinkingLevel: "MINIMAL",
      },
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K",
      },
    } as never,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildPreviewPrompt(products),
          },
          await imagePartFromUrl(userFacePhotoUrl),
          await imagePartFromUrl(referencePhotoUrl),
        ],
      },
    ],
  });

  const image = await readImageStream(response);

  if (!image) {
    return null;
  }

  const file = new File(
    [image.buffer],
    `${templateId}-preview.${image.extension}`,
    {
      type: image.mimeType,
    },
  );

  const uploaded = await utapi.uploadFiles(file);
  const result = Array.isArray(uploaded) ? uploaded[0] : uploaded;

  if (!result) {
    throw new Error("Preview upload did not return a result");
  }

  if ("error" in result && result.error) {
    throw new Error(result.error.message ?? "Preview upload failed");
  }

  if (!("data" in result) || !result.data?.ufsUrl) {
    throw new Error("Preview upload did not return a file URL");
  }

  return result.data.ufsUrl;
}

async function updateActivity(
  kind: "research" | "adversarial" | "rebuttal" | "finalize",
  jobId: string,
  patch: {
    status?: "pending" | "running" | "completed" | "failed";
    startedAt?: Date;
    completedAt?: Date;
    payload?: ActivityPayload[];
  },
) {
  await db
    .update(makeupProcessingActivities)
    .set(patch)
    .where(
      and(
        eq(makeupProcessingActivities.jobId, jobId),
        eq(makeupProcessingActivities.kind, kind),
      ),
    );
}

async function setJobState(
  jobId: string,
  patch: Partial<{
    status: "queued" | "processing" | "completed" | "failed";
    currentStage: "research" | "adversarial" | "rebuttal" | "finalize";
    startedAt: Date;
    completedAt: Date;
    elapsedSeconds: number;
    errorMessage: string | null;
  }>,
) {
  await db
    .update(makeupProcessingJobs)
    .set(patch)
    .where(eq(makeupProcessingJobs.id, jobId));
}

function buildResearchPayload(
  result: ResearchResult,
  round: number,
  thoughts: string[] = [],
): ActivityPayload[] {
  const leadProducts = result.products.slice(0, 4);
  const categorySummary = leadProducts
    .map(
      (product) =>
        `${product.category} using ${product.dupeBrand} ${product.dupeProductName}`,
    )
    .join(", ");
  const sourceSignals = leadProducts.map((product, index) => ({
    label: `source.${index + 1}`,
    detail: `${product.whereToBuy} — ${product.dupeBrand} ${product.dupeProductName} — $${product.dupePriceCad.toFixed(2)} CAD`,
  }));

  return [
    ...formatThoughtPayload(thoughts, "research.thought"),
    {
      label: "visual.element.analysis",
      detail:
        round === 1
          ? result.rationaleSummary
          : `Round ${round} revision complete. ${result.rationaleSummary}`,
    },
    {
      label: "aesthetic.classification",
      detail: `The working classification is ${result.lookName}. I am using the strongest visible cues, finish, and color placement to keep the recreated look technically faithful.`,
    },
    {
      label: "tutorial.and.retail.research",
      detail: `I am synthesizing tutorials and Canadian retail listings to keep the build realistic within the $${result.totalEstimatedCostCad.toFixed(2)} CAD estimate. The current strongest matches are ${categorySummary}.`,
    },
    {
      label: "researching.websites",
      detail: `Grounded search has started surfacing tutorials, retailer listings, and dupe candidates for ${result.lookName}.`,
    },
    ...sourceSignals,
    {
      label: "technical.aesthetic.identification",
      detail: `Current projected total is $${result.totalEstimatedCostCad.toFixed(2)} CAD, with the highest-confidence matches concentrated around ${leadProducts
        .map((product) => product.category)
        .join(", ")}.`,
    },
  ];
}

function buildRebuttalPayload(
  result: RebuttalResult,
  thoughts: string[] = [],
): ActivityPayload[] {
  return [
    ...formatThoughtPayload(thoughts, "adversarial.thought"),
    {
      label: "critical.audit.summary",
      detail: result.verdict,
    },
    ...(result.concerns.length > 0
      ? result.concerns.flatMap((concern, index) => [
          {
            label:
              concern.type === "health"
                ? "ingredient.scan"
                : concern.type === "cost"
                  ? "price.audit"
                  : concern.type === "missing"
                    ? "coverage.audit"
                    : "accuracy.audit",
            detail: concern.summary,
          },
          {
            label: `revision.direction.${index + 1}`,
            detail: concern.recommendation,
          },
        ])
      : [
          {
            label: "rebuttal.result",
            detail: "No material issues found",
          },
        ]),
  ];
}

function buildResearchPrompt(budgetCad: number, rebuttalNotes: string[]) {
  return [
    "You are the main research agent in a makeup analysis pipeline.",
    "You will receive TWO images: (1) a reference look to recreate, and (2) the user's own face photo.",
    "Adapt shade recommendations to the user's skin tone, undertone, and features visible in their face photo — do not blindly copy the reference model's shades if they wouldn't suit the user.",
    "Use Google Search grounding to identify every visible makeup product in the reference image and recommend the strongest budget-conscious dupes available in Canada that flatter the user.",
    `The total budget cap is $${budgetCad.toFixed(2)} CAD.`,
    "Prioritize affordable, high-quality products from brands like e.l.f., NYX, Maybelline, L'Oreal, Wet n Wild, Essence, Milani, and similar accessible options.",
    "Write a detailed research report in markdown. For EACH dupe product, include:",
    "- category (lips | cheeks | eyes | skin | highlight | brows | lashes)",
    "- the original/inspiration product name + brand + shade",
    "- the dupe product name + brand + realistic Canadian price",
    "- the retailer name (whereToBuy)",
    "- quality score (1-10) and confidence (high | medium | low)",
    "Also give the look a lookName and a short rationale.",
    "Rules:",
    "- Identify all major visible makeup categories needed to recreate the look.",
    "- Keep the total estimated cost within the budget if reasonably possible.",
    "- Prefer grounded, real products and realistic Canadian pricing.",
    "- The dupe set should feel balanced across the total budget rather than overspending on one category.",
    rebuttalNotes.length > 0
      ? `Address these rebuttal concerns explicitly: ${rebuttalNotes.join(" ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildResearchFormatterPrompt(freeText: string, budgetCad: number) {
  return [
    "Convert the following makeup research report into the structured JSON shape described by the response schema.",
    `Budget cap: $${budgetCad.toFixed(2)} CAD.`,
    "If totalEstimatedCostCad is not explicitly stated, set it to 0 and the caller will recompute from products.",
    "",
    "Research report:",
    freeText,
  ].join("\n");
}

function buildRebuttalPrompt(
  budgetCad: number,
  research: ResearchResult,
  round: number,
) {
  return [
    "You are the adversarial / rebuttal agent in a makeup pipeline.",
    "You will receive TWO images: (1) the reference look, and (2) the user's own face photo.",
    "Use Google Search grounding to audit the proposed research result against BOTH images.",
    `This is rebuttal round ${round}.`,
    `Budget cap: $${budgetCad.toFixed(2)} CAD.`,
    "Check for:",
    "- unsafe or irritating product suggestions",
    "- unrealistic pricing or availability",
    "- mismatched categories or shades",
    "- shades that would clash with the user's skin tone / undertone / features",
    "- missing products required to recreate the look",
    "Write your audit as a short markdown report. State whether there is a material rebuttal, a one-sentence verdict, and list any concerns (type, summary, recommendation).",
    `Research result JSON:\n${JSON.stringify(research, null, 2)}`,
  ].join("\n");
}

function buildRebuttalFormatterPrompt(freeText: string) {
  return [
    "Convert the following audit report into the structured JSON shape described by the response schema.",
    "If no material concerns are raised, set hasRebuttal to false and concerns to an empty array.",
    "",
    "Audit report:",
    freeText,
  ].join("\n");
}

function buildInstructionsPrompt(research: ResearchResult) {
  return [
    "You are a professional makeup artist writing beginner-friendly application steps.",
    "Return structured JSON matching the provided response schema.",
    "Rules:",
    "- Order steps correctly: skincare/base -> eyes -> cheeks -> lips.",
    "- For each step include the product name, tool, technique, and one blending tip.",
    "- Keep the language clear and beginner-friendly.",
    `Products JSON:\n${JSON.stringify(research.products, null, 2)}`,
  ].join("\n");
}

const researchResponseSchema = {
  type: "object",
  required: ["lookName", "rationaleSummary", "totalEstimatedCostCad", "products"],
  properties: {
    lookName: { type: "string" },
    rationaleSummary: { type: "string" },
    totalEstimatedCostCad: { type: "number" },
    products: {
      type: "array",
      items: {
        type: "object",
        required: [
          "category",
          "originalProductName",
          "originalBrand",
          "shadeDescription",
          "dupeBrand",
          "dupeProductName",
          "dupePriceCad",
          "whereToBuy",
          "qualityScore",
          "confidence",
        ],
        properties: {
          category: { type: "string" },
          originalProductName: { type: "string" },
          originalBrand: { type: "string" },
          shadeDescription: { type: "string" },
          dupeBrand: { type: "string" },
          dupeProductName: { type: "string" },
          dupePriceCad: { type: "number" },
          whereToBuy: { type: "string" },
          qualityScore: { type: "number" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
};

const rebuttalResponseSchema = {
  type: "object",
  required: ["hasRebuttal", "verdict", "concerns"],
  properties: {
    hasRebuttal: { type: "boolean" },
    verdict: { type: "string" },
    concerns: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "summary", "recommendation"],
        properties: {
          type: {
            type: "string",
            enum: ["health", "cost", "accuracy", "missing"],
          },
          summary: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    },
  },
};

const instructionsResponseSchema = {
  type: "object",
  required: ["steps"],
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        required: ["order", "productName", "tool", "technique", "blendingTip"],
        properties: {
          order: { type: "integer" },
          productName: { type: "string" },
          tool: { type: "string" },
          technique: { type: "string" },
          blendingTip: { type: "string" },
        },
      },
    },
  },
};

function buildPreviewPrompt(products: ResearchProduct[]) {
  const productLines = products
    .map(
      (product) =>
        `- ${product.category}: apply ${product.shadeDescription} using ${product.dupeBrand} ${product.dupeProductName}`,
    )
    .join("\n");

  return [
    "Here are two images. The first is the user's face photo. The second is a reference makeup look.",
    "Apply the following makeup onto the person in the first image, keeping their face, skin tone, facial features, hair, and background exactly the same.",
    "Only change the makeup so the result is a natural, photorealistic try-on preview.",
    productLines,
  ].join("\n");
}

async function imagePartFromUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const mimeType =
    response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

async function readTextAndThoughtStream(
  stream: AsyncIterable<unknown>,
  callbacks: StreamCallbacks = {},
) {
  let answerText = "";
  let thoughtText = "";
  let lastSentThoughtText = "";
  let lastSentAnswerText = "";
  let lastFlushAt = 0;

  const flushUpdates = async (force = false) => {
    if (!force && Date.now() - lastFlushAt < 500) {
      return;
    }

    if (
      callbacks.onThoughtUpdate &&
      thoughtText &&
      thoughtText !== lastSentThoughtText
    ) {
      lastSentThoughtText = thoughtText;
      await callbacks.onThoughtUpdate(thoughtText.trim());
    }

    if (
      callbacks.onAnswerUpdate &&
      answerText &&
      answerText !== lastSentAnswerText
    ) {
      lastSentAnswerText = answerText;
      await callbacks.onAnswerUpdate(answerText.trim());
    }

    lastFlushAt = Date.now();
  };

  for await (const chunk of stream) {
    if (
      typeof chunk !== "object" ||
      chunk === null ||
      !("candidates" in chunk)
    ) {
      continue;
    }

    const parts = (
      chunk as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
              thought?: boolean;
            }>;
          };
        }>;
      }
    ).candidates?.[0]?.content?.parts;

    if (!parts) {
      if ("text" in chunk && typeof chunk.text === "string") {
        answerText += chunk.text;
        await flushUpdates();
      }
      continue;
    }

    for (const part of parts) {
      if (!part?.text) {
        continue;
      }

      if (part.thought) {
        thoughtText += part.text;
      } else {
        answerText += part.text;
      }

      await flushUpdates();
    }
  }

  await flushUpdates(true);

  return {
    answerText: answerText.trim(),
    thoughtText: thoughtText.trim(),
  };
}

async function getGoogleGenAIClient(): Promise<GoogleGenAIClient> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const { GoogleGenAI } = await import("@google/genai");

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  }) as GoogleGenAIClient;
}

async function readImageStream(stream: AsyncIterable<unknown>) {
  let latestInlineData:
    | {
        mimeType?: string;
        data?: string;
      }
    | undefined;

  for await (const chunk of stream) {
    if (
      typeof chunk !== "object" ||
      chunk === null ||
      !("candidates" in chunk)
    ) {
      continue;
    }

    const inlineData = (
      chunk as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: {
                mimeType?: string;
                data?: string;
              };
            }>;
          };
        }>;
      }
    ).candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (inlineData?.data) {
      latestInlineData = inlineData;
    }
  }

  if (!latestInlineData?.data) {
    return null;
  }

  const mimeType = latestInlineData.mimeType ?? "image/png";
  return {
    mimeType,
    extension: extensionFromMimeType(mimeType),
    buffer: Buffer.from(latestInlineData.data, "base64"),
  };
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
}

function parseJson(text: string) {
  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const startIndex = withoutFences.search(/[\[{]/);
  const endIndex = Math.max(
    withoutFences.lastIndexOf("}"),
    withoutFences.lastIndexOf("]"),
  );

  const candidate =
    startIndex >= 0 && endIndex >= 0
      ? withoutFences.slice(startIndex, endIndex + 1)
      : withoutFences;

  return JSON.parse(candidate) as unknown;
}

function parseJsonWithSchema<T>(text: string, schema: z.ZodType<T>) {
  const parsed = parseJson(text);
  return schema.parse(parsed);
}

function resolveMaybeEncryptedText(value: string) {
  try {
    return decryptText(value);
  } catch {
    return value;
  }
}

function splitThoughtSummaries(thoughtText: string) {
  if (!thoughtText.trim()) {
    return [];
  }

  const chunks = thoughtText
    .split(/\n\s*\n+/)
    .map((section) =>
      section
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .filter(Boolean);

  const merged: string[] = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const current = chunks[i];
    const isHeading =
      /^\*\*[^*\n]+\*\*\.?$/.test(current) ||
      /^#{1,6}\s+\S.*$/.test(current) ||
      (!current.includes("\n") && current.length <= 80);

    if (isHeading && i + 1 < chunks.length) {
      merged.push(`${current}\n\n${chunks[i + 1]}`);
      i += 1;
    } else {
      merged.push(current);
    }
  }

  return merged.slice(0, 6);
}

function formatThoughtPayload(
  thoughts: string[],
  prefix: string,
): ActivityPayload[] {
  return thoughts.map((thought, index) => ({
    label: `${prefix}.${index + 1}`,
    detail: thought,
  }));
}

function buildLivePayload(
  basePayload: ActivityPayload[],
  liveLabel: string,
  liveText: string,
) {
  if (!liveText.trim()) {
    return basePayload;
  }

  return [
    ...basePayload,
    {
      label: liveLabel,
      detail: liveText.trim(),
    },
  ];
}

function normalizeCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatInstructions(result: InstructionsResult) {
  return result.steps
    .sort((a, b) => a.order - b.order)
    .map(
      (step, index) =>
        `${index + 1}. ${step.productName}: Use ${step.tool}. ${step.technique} Blending tip: ${step.blendingTip}`,
    )
    .join("\n");
}
