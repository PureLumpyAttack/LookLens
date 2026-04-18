import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <SignIn
        path="/sign-in"
        routing="path"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </main>
  );
}
