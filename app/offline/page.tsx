export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm opacity-70">
        Check your connection and try again.
      </p>
    </main>
  );
}
