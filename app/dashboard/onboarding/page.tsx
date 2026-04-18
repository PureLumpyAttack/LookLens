import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import OnboardingClient from "./client";

export default async function Onboarding() {
  const { onboarded } = await getAuthState();

  if (onboarded) {
    return redirect("/dashboard");
  }

  return <OnboardingClient />;
}
