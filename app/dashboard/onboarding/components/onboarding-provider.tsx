"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OnboardingDraft = {
  introAcknowledged: boolean;
  started: boolean;
  facePhotoFile: File | null;
  facePhotoPreview: string | null;
  budget: number | null;
};

type OnboardingContextValue = {
  activeStep: number;
  totalSteps: number;
  allowStepSelection: boolean;
  draft: OnboardingDraft;
  setActiveStep: (step: number) => void;
  setAllowStepSelection: (value: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

type OnboardingProviderProps = {
  children: ReactNode;
  totalSteps: number;
};

export function OnboardingProvider({
  children,
  totalSteps,
}: OnboardingProviderProps) {
  const [activeStep, setActiveStepState] = useState(1);
  const [allowStepSelection, setAllowStepSelection] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({
    introAcknowledged: false,
    started: false,
    facePhotoFile: null,
    facePhotoPreview: null,
    budget: null,
  });

  const setActiveStep = useCallback(
    (step: number) => {
      setActiveStepState(Math.min(Math.max(step, 1), totalSteps));
    },
    [totalSteps],
  );

  const nextStep = useCallback(() => {
    setActiveStepState((current) => Math.min(current + 1, totalSteps));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setActiveStepState((current) => Math.max(current - 1, 1));
  }, []);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      activeStep,
      totalSteps,
      allowStepSelection,
      draft,
      setActiveStep,
      setAllowStepSelection,
      nextStep,
      previousStep,
      updateDraft,
    }),
    [
      activeStep,
      allowStepSelection,
      draft,
      nextStep,
      previousStep,
      setActiveStep,
      totalSteps,
      updateDraft,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }

  return context;
}
