"use client";

import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";

const steps = [
  { title: "Step 1", description: "Description" },
  { title: "Step 2", description: "Description" },
  { title: "Step 3", description: "Description" },
];

export default function Onboarding() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Stepper
        defaultValue={2}
        indicators={{
          completed: <CheckIcon className="size-3.5" />,
          loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
        }}
        className="w-full max-w-lg space-y-8"
      >
        <StepperPanel className="text-sm">
          {steps.map((step, index) => (
            <StepperContent
              key={index}
              value={index + 1}
              className="flex items-center justify-center"
            >
              {step.title} content
            </StepperContent>
          ))}
        </StepperPanel>

        <StepperNav>
          {steps.map((step, index) => (
            <StepperItem key={index} step={index + 1} className="relative">
              <StepperTrigger className="flex justify-start gap-1.5">
                <StepperIndicator>{index + 1}</StepperIndicator>
                <div className="flex flex-col items-start gap-0.5">
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription>{step.description}</StepperDescription>
                </div>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator className="md:mx-2.5" />
              )}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
    </div>
  );
}
