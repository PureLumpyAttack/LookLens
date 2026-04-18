"use client";

import { Button } from "@/components/ui/button";
import { useOnboarding } from "../onboarding-provider";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";

export function IntroductionStep() {
  const { nextStep, setAllowStepSelection, updateDraft } = useOnboarding();
  const { user } = useUser();

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
          <CardDescription>
            Welcome <span className="text-white">{user?.fullName}</span>, this
            is a platform where yep, by signing up you agree to the{" "}
            <Link
              href={"/terms"}
              target="_blank"
              className={"text-white hover:underline"}
            >
              Terms Of Service
            </Link>{" "}
            and{" "}
            <Link
              href={"/privacy"}
              target="_blank"
              className={"text-white hover:underline"}
            >
              Privacy Policy
            </Link>
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => {
              updateDraft({ introAcknowledged: true });
              setAllowStepSelection(true);
              nextStep();
            }}
          >
            Agree
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
