import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "LookLens | Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="min-w-125">
        <CardHeader>
          <CardTitle className="flex justify-start items-center gap-2">
            <div className="bg-red-400 rounded-full w-2.5 h-2.5 animate-pulse" />
            <span>You&apos;re offline right now</span>
          </CardTitle>
          <CardDescription>
            LookLens will reconnect automatically when your connection comes
            back. Head back home once you&apos;re online again.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/">
            <Button>Back Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
