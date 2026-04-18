"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  CheckIcon,
  GalleryVerticalEndIcon,
  GavelIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react";

export default function ProcessingPage() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            LookLens
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className={cn("flex flex-col gap-6")}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold">
                    <Spinner className="size-6" />
                    <span>Processing your request</span>
                  </h1>
                  <p className="text-left text-sm text-muted-foreground">
                    Our systems are determining the source, origin, health risks
                    and most cost efficient way to apply the makeup.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-y-auto bg-muted px-6 py-8 lg:block">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-medium">Activity</h2>
              <p className="text-sm text-muted-foreground">
                Live trace of the agents working on your look.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <Spinner className="size-3" />
              Elapsed {elapsedLabel}
            </div>
          </div>

          <Separator />

          <ol className="relative flex flex-col gap-4 pl-6">
            <TimelineItem
              status="done"
              icon={<SearchIcon className="size-4" />}
              title="Main Researcher Agent"
              subtitle="Identified makeup and cheapest reproduction"
            >
              <ToolCall
                label="web.search"
                detail='"clean girl makeup dupes 2026"'
              />
              <ToolCall
                label="product.lookup"
                detail="Rare Beauty Soft Pinch → Elf Camo Blush"
              />
              <ToolCall
                label="price.compare"
                detail="Best price match: $6.80"
              />
            </TimelineItem>

            <TimelineItem
              status="running"
              icon={<ShieldAlertIcon className="size-4" />}
              title="Adversarial Agent"
              subtitle="Contesting findings for health risks & cost"
            >
              <ToolCall
                label="ingredient.scan"
                detail="Checking comedogenic + allergen flags"
              />
              <ToolCall
                label="price.audit"
                detail="Verifying cheapest reproduction claim"
              />
            </TimelineItem>

            <TimelineItem
              status="pending"
              icon={<GavelIcon className="size-4" />}
              title="Rebuttal check"
              subtitle="If rebuttal → loop back to researcher"
            />

            <TimelineItem
              status="pending"
              icon={<SparklesIcon className="size-4" />}
              title="Finalize result"
              subtitle="Assemble products, steps, and price"
            />
          </ol>
        </div>
      </div>
    </div>
  );
}

type TimelineStatus = "done" | "running" | "pending";

function TimelineItem({
  status,
  icon,
  title,
  subtitle,
  children,
}: {
  status: TimelineStatus;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative before:absolute before:-left-6 before:top-7 before:-bottom-5 before:w-px before:bg-border/60 last:before:hidden">
      <span
        className={cn(
          "absolute -left-9 top-1 flex size-6 items-center justify-center rounded-full ring-4 ring-muted",
          status === "done" && "bg-primary text-primary-foreground",
          status === "running" &&
            "border border-border bg-background text-foreground",
          status === "pending" &&
            "border border-border/60 bg-background text-muted-foreground"
        )}
      >
        {status === "running" ? (
          <Spinner className="size-3" />
        ) : status === "done" ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
        )}
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <p
            className={cn(
              "text-sm font-medium",
              status === "pending" && "text-muted-foreground"
            )}
          >
            {title}
          </p>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {children && (
          <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/40 p-2">
            {children}
          </div>
        )}
      </div>
    </li>
  );
}

function ToolCall({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-muted-foreground">{detail}</span>
    </div>
  );
}
