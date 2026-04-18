import DashboardPage from "./client";

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";

export default async function Page() {
  const { onboarded } = await getAuthState();

  if (!onboarded) {
    return redirect("/dashboard/onboarding");
  }

  return <DashboardPage />;
}
