"use client";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";

import {
  OnboardingProvider,
  useOnboarding,
} from "./components/onboarding-provider";
import { BudgetStep } from "./components/steps/budget-step";
import { GettingStartedStep } from "./components/steps/getting-started-step";
import { IntroductionStep } from "./components/steps/introduction-step";

const steps = [
  { title: "Introduction", Component: IntroductionStep, clickable: false },
  { title: "Getting Started", Component: GettingStartedStep },
  { title: "Budget", Component: BudgetStep },
];

function OnboardingFlow() {
  const { activeStep, allowStepSelection, setActiveStep } = useOnboarding();

  return (
    <div className="flex h-screen items-center justify-center">
      <Stepper
        value={activeStep}
        onValueChange={(step) => {
          const targetStep = steps[step - 1];

          if (!targetStep) {
            return;
          }

          if (targetStep.clickable === false && step !== activeStep) {
            return;
          }

          if (!allowStepSelection && step !== activeStep) {
            return;
          }

          setActiveStep(step);
        }}
        indicators={{
          completed: <CheckIcon className="size-3.5" />,
          loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
        }}
        className="w-full max-w-lg space-y-8"
      >
        <StepperNav className="absolute top-0 py-10 max-w-lg">
          {steps.map((step, index) => (
            <StepperItem key={step.title} step={index + 1} className="relative">
              <StepperTrigger
                disabled={!allowStepSelection || step.clickable === false}
                className="flex justify-start gap-1.5"
              >
                <StepperIndicator>{index + 1}</StepperIndicator>
                <div className="flex flex-col items-start gap-0.5">
                  <StepperTitle>{step.title}</StepperTitle>
                </div>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator className="md:mx-2.5" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <StepperPanel className="text-sm">
          {steps.map((step, index) => {
            const StepComponent = step.Component;

            return (
              <StepperContent
                key={step.title}
                value={index + 1}
                className="flex items-center justify-center"
              >
                <StepComponent />
              </StepperContent>
            );
          })}
        </StepperPanel>
      </Stepper>
    </div>
  );
}

export default function OnboardingClient() {
  return (
    <OnboardingProvider totalSteps={steps.length}>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
