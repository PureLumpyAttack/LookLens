"use client";

import { useState, useTransition } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Slider } from "@/components/ui/slider";
import { budgetConstraint } from "@/lib/constants";
import { uploadFiles } from "@/lib/uploadthing";
import { useOnboarding } from "../onboarding-provider";
import { registerAccount } from "../../server";

function getSliderValue(value: number | readonly number[]) {
  return Array.isArray(value) ? (value[0] ?? budgetConstraint.default) : value;
}

export function BudgetStep() {
  const { draft, previousStep, updateDraft } = useOnboarding();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedBudget = draft.budget ?? budgetConstraint.default;
  const [liveBudget, setLiveBudget] = useState(selectedBudget);

  const canSubmit = Boolean(draft.facePhotoFile);

  return (
    <div className="flex w-full flex-col items-center gap-4 px-5">
      <div className="flex items-center gap-2 self-center font-medium text-lg">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
        </div>
        LookLens
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Set your budget</CardTitle>
          <CardDescription>
            Choose the maximum spend you want LookLens to optimize around when
            surfacing recommendations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-6 rounded-[2rem] border border-border/60 bg-muted/30 p-6">
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Budget cap
              </p>
              <RollingNumber
                value={liveBudget}
                className="justify-center text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
                duration={500}
                staggerDelay={40}
                formatOptions={{
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }}
              />
              <p className="text-sm text-muted-foreground">
                We&apos;ll keep recommendations at or below your range.
              </p>
            </div>

            <div className="space-y-4">
              <Slider
                value={[liveBudget]}
                min={budgetConstraint.minimum}
                max={budgetConstraint.maximum}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-foreground [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-foreground/10"
                onValueChange={(value) => {
                  const nextBudget = getSliderValue(value);

                  setLiveBudget(nextBudget);
                  updateDraft({ budget: nextBudget });
                }}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>${budgetConstraint.minimum}</span>
                <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-foreground">
                  ${liveBudget}
                </span>
                <span>${budgetConstraint.maximum}</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between gap-3">
          <Button variant="outline" onClick={previousStep}>
            Back
          </Button>

          <Button
            disabled={!canSubmit || isPending}
            onClick={() => {
              if (!draft.facePhotoFile) {
                toast.error("Please complete the Getting Started Step.");
                return;
              }

              async function registerNewAccount() {
                if (!draft.facePhotoFile) {
                  throw new Error("Face Photo is invalid, please try again");
                }

                const [uploadedFile] = await uploadFiles("userPhotoUploader", {
                  files: [draft.facePhotoFile],
                });

                if (!uploadedFile?.ufsUrl) {
                  throw new Error("UploadThing did not return a file URL");
                }

                await registerAccount(liveBudget, uploadedFile.ufsUrl);
              }

              startTransition(async () => {
                toast.promise(registerNewAccount, {
                  loading: "Saving your profile...",
                  success: () => {
                    router.push("/dashboard");
                    router.refresh();
                    return "Profile saved. Sending you to the dashboard.";
                  },
                  error: (result: Error) => {
                    router.refresh();
                    return result.message;
                  },
                });
              });
            }}
          >
            {isPending ? "Saving..." : "To Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
