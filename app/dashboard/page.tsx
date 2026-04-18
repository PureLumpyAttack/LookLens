import DashboardPage from "./client";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { loadSavedMakeups } from "./data";

export default async function Page() {
  const { onboarded } = await getAuthState();

  if (!onboarded) {
    return redirect("/dashboard/onboarding");
  }

  const { userId } = await auth();
  const savedMakeups = await loadSavedMakeups(userId!);

  return <DashboardPage savedMakeups={savedMakeups} />;
}
