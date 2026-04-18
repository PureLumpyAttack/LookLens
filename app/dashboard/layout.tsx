import { getAuthState } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { authenticated } = await getAuthState();

  if (!authenticated) {
    return redirect("/sign-in");
  }

  return children;
}
