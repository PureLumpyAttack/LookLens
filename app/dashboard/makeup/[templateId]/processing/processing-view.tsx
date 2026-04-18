"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  GalleryVerticalEndIcon,
  GavelIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SquareTerminalIcon,
  XIcon,
} from "lucide-react";

type ActivityPayloadItem = {
  label: string;
  detail: string;
};

type ProcessingActivityView = {
  id: string;
  kind: "research" | "adversarial" | "rebuttal" | "finalize";
  title: string;
  description: string | null;
  status: "pending" | "running" | "completed" | "failed";
  payload: ActivityPayloadItem[];
};

export function ProcessingView({
  templateId,
  displayImageUrl,
  initialElapsedSeconds,
  templateName,
  activities,
  jobStatus,
}: {
  templateId: string;
  displayImageUrl: string | null;
  initialElapsedSeconds: number;
  templateName: string;
  activities: ProcessingActivityView[];
  jobStatus: "queued" | "processing" | "completed" | "failed";
}) {
  const router = useRouter();
  const [displayImage, setDisplayImage] = useState(displayImageUrl);
  const [activityState, setActivityState] = useState(activities);
  const [jobState, setJobState] = useState(jobStatus);
  const [elapsed, setElapsed] = useState(initialElapsedSeconds);
  const [revealedByActivity, setRevealedByActivity] = useState<
    Record<string, number>
  >({});
  const [showThinking, setShowThinking] = useState(true);

  useEffect(() => {
    setDisplayImage(displayImageUrl);
  }, [displayImageUrl]);

  useEffect(() => {
    setActivityState(activities);
  }, [activities]);

  useEffect(() => {
    setJobState(jobStatus);
  }, [jobStatus]);

  useEffect(() => {
    setElapsed(initialElapsedSeconds);
  }, [initialElapsedSeconds]);

  useEffect(() => {
    if (jobState !== "processing") {
      return;
    }

    const id = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [jobState]);

  useEffect(() => {
    if (jobState === "completed" || jobState === "failed") {
      return;
    }

    const eventSource = new EventSource(
      `/dashboard/makeup/${templateId}/processing/events`,
    );

    const handleSnapshot = (event: MessageEvent<string>) => {
      const snapshot = JSON.parse(event.data) as {
        templateStatus: "processing" | "ready" | "failed";
        displayImageUrl: string | null;
        elapsedSeconds: number;
        jobStatus: "queued" | "processing" | "completed" | "failed";
        activities: ProcessingActivityView[];
      };

      setDisplayImage(snapshot.displayImageUrl);
      setElapsed(snapshot.elapsedSeconds);
      setJobState(snapshot.jobStatus);
      setActivityState(snapshot.activities);

      if (snapshot.templateStatus === "ready") {
        router.replace(`/dashboard/makeup/${templateId}`);
      }
    };

    const handleError = () => {
      eventSource.close();
    };

    eventSource.addEventListener("snapshot", handleSnapshot as EventListener);
    eventSource.addEventListener("error", handleError);

    return () => {
      eventSource.removeEventListener(
        "snapshot",
        handleSnapshot as EventListener,
      );
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [jobState, router, templateId]);

  useEffect(() => {
    setRevealedByActivity((current) => {
      const next = { ...current };

      for (const activity of activityState) {
        if (!(activity.id in next)) {
          next[activity.id] =
            activity.status === "pending"
              ? 0
              : Math.min(activity.payload.length, 1);
        }

        if (activity.status === "pending") {
          next[activity.id] = 0;
        }

        if (activity.payload.length > (next[activity.id] ?? 0)) {
          next[activity.id] = Math.max(next[activity.id] ?? 0, 1);
        }
      }

      return next;
    });
  }, [activityState]);

  useEffect(() => {
    const hasPendingReveal = activityState.some((activity) => {
      if (activity.status === "pending") {
        return false;
      }

      return (revealedByActivity[activity.id] ?? 0) < activity.payload.length;
    });

    if (!hasPendingReveal) {
      return;
    }

    const id = setInterval(() => {
      setRevealedByActivity((current) => {
        const next = { ...current };
        let didReveal = false;

        for (const activity of activityState) {
          if (activity.status === "pending") {
            continue;
          }

          const visibleCount = next[activity.id] ?? 0;

          if (visibleCount < activity.payload.length) {
            next[activity.id] = visibleCount + 1;
            didReveal = true;
            break;
          }
        }

        return didReveal ? next : current;
      });
    }, 240);

    return () => clearInterval(id);
  }, [activityState, revealedByActivity]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

  const activeActivity = useMemo(
    () => activityState.find((activity) => activity.status === "running"),
    [activityState],
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
      <div className="flex flex-col gap-4 border-r border-border/60 p-6 md:p-10 lg:sticky lg:top-0 lg:h-svh">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/dashboard" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            LookLens
          </a>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/70 bg-background/40 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            {displayImage ? (
              <img
                src={displayImage}
                alt={`${templateName} preview`}
                className="aspect-[4/5] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-muted text-sm text-muted-foreground">
                Image unavailable
              </div>
            )}
          </div>

          <div className="w-full max-w-sm space-y-3 text-center">
            <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
              <Spinner className="size-6" />
              <span>Processing {templateName}</span>
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              We’re tracing the full research and rebuttal workflow, then
              building your preview and final application steps.
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-y-auto bg-muted/70 px-6 py-8 max-lg:hidden lg:h-svh">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/60 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="hidden h-5 w-px bg-border/70 sm:block" />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                    onClick={() => setShowThinking((value) => !value)}
                  >
                    {showThinking ? "Hide thinking" : "Show thinking"}
                    <ChevronDownIcon
                      className={cn(
                        "size-4 transition",
                        showThinking && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                {jobState === "processing" ? (
                  <Spinner className="size-3" />
                ) : jobState === "failed" ? (
                  <XIcon className="size-3" />
                ) : (
                  <CheckIcon className="size-3" />
                )}
                Elapsed {elapsedLabel}
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-lg font-medium">Activity</h2>
                  <p className="text-sm text-muted-foreground">
                    Live trace of the agents working on your look.
                  </p>
                </div>
              </div>

              <Separator className="my-5" />

              <ol className="relative flex flex-col gap-6 pl-10">
                {activityState.map((activity) => (
                  <TimelineItem
                    key={activity.id}
                    status={mapTimelineStatus(activity.status)}
                    icon={getActivityIcon(activity.kind)}
                    title={activity.title}
                    subtitle={activity.description ?? undefined}
                  >
                    {showThinking ? (
                      <ReasoningSurface
                        items={activity.payload}
                        status={activity.status}
                        visibleCount={revealedByActivity[activity.id] ?? 0}
                      />
                    ) : null}
                  </TimelineItem>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineStatus = "done" | "running" | "pending" | "failed";

function mapTimelineStatus(
  status: "pending" | "running" | "completed" | "failed",
): TimelineStatus {
  if (status === "completed") return "done";
  if (status === "running") return "running";
  if (status === "failed") return "failed";
  return "pending";
}

function getActivityIcon(kind: ProcessingActivityView["kind"]) {
  switch (kind) {
    case "research":
      return <SearchIcon className="size-4" />;
    case "adversarial":
      return <ShieldAlertIcon className="size-4" />;
    case "rebuttal":
      return <GavelIcon className="size-4" />;
    case "finalize":
      return <SparklesIcon className="size-4" />;
  }
}

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
    <li className="relative before:absolute before:-left-7 before:top-10 before:-bottom-10 before:w-px before:bg-border/60 last:before:hidden">
      <span
        className={cn(
          "absolute -left-10 top-1 flex size-7 items-center justify-center rounded-full ring-4 ring-muted/70",
          status === "done" && "bg-primary text-primary-foreground",
          status === "running" &&
            "border border-border bg-background text-foreground",
          status === "pending" &&
            "border border-border/60 bg-background text-muted-foreground",
          status === "failed" && "bg-destructive/15 text-destructive",
        )}
      >
        {status === "running" ? (
          <Spinner className="size-3.5" />
        ) : status === "done" ? (
          <CheckIcon className="size-4" />
        ) : status === "failed" ? (
          <XIcon className="size-4" />
        ) : (
          <span className="size-2 rounded-full bg-muted-foreground/60" />
        )}
      </span>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <p
              className={cn(
                "text-sm font-medium",
                status === "pending" && "text-muted-foreground",
                status === "failed" && "text-destructive",
              )}
            >
              {title}
            </p>
          </div>
          {subtitle ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </li>
  );
}

function ReasoningSurface({
  items,
  status,
  visibleCount,
}: {
  items: ActivityPayloadItem[];
  status: ProcessingActivityView["status"];
  visibleCount: number;
}) {
  const visibleItems = items.slice(0, visibleCount);
  const narrativeItems = visibleItems.filter(
    (item) => !item.label.startsWith("source."),
  );
  const liveItems = narrativeItems.filter((item) =>
    item.label.endsWith(".live"),
  );
  const stableItems = narrativeItems.filter(
    (item) => !item.label.endsWith(".live"),
  );
  const sourceItems = visibleItems.filter((item) =>
    item.label.startsWith("source."),
  );
  const isStreaming = status === "running";
  const shouldShowPlaceholder =
    status === "pending" || (isStreaming && visibleItems.length === 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/55">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-primary/80" />
            {status === "pending"
              ? "Queued analysis"
              : isStreaming
                ? "Thinking..."
                : status === "failed"
                  ? "Analysis failed"
                  : "Thought"}
          </div>
          {isStreaming ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] text-primary">
              <Spinner className="size-3" />
              Thinking
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        {liveItems.map((item, index) => (
          <ReasoningCard
            key={`${item.label}-${index}`}
            label={item.label}
            detail={item.detail}
            live
          />
        ))}

        {stableItems.map((item, index) => (
          <ReasoningCard
            key={`${item.label}-${item.detail}-${index}`}
            label={item.label}
            detail={item.detail}
          />
        ))}

        {sourceItems.length > 0 ? <SourcesSurface items={sourceItems} /> : null}

        {shouldShowPlaceholder ? <ThinkingSkeleton /> : null}

        {isStreaming && visibleItems.length > 0 ? (
          <ThinkingSkeleton compact />
        ) : null}
      </div>
    </div>
  );
}

function SourcesSurface({ items }: { items: ActivityPayloadItem[] }) {
  return (
    <div className="border-l border-border/80 pl-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchIcon className="size-3.5" />
        </div>
        <p className="text-base font-medium">Sources</p>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <SourceChip
            key={`${item.label}-${item.detail}-${index}`}
            detail={item.detail}
          />
        ))}
      </div>
    </div>
  );
}

function ReasoningCard({
  label,
  detail,
  live = false,
}: {
  label: string;
  detail: string;
  live?: boolean;
}) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div
        className={cn(
          "border-l border-border/80 pl-4",
          live && "border-primary/60",
        )}
      >
        <div
          className={cn(
            "mb-2 inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground",
            live && "bg-primary/10 text-primary",
          )}
        >
          {live ? <SquareTerminalIcon className="size-3" /> : null}
          {formatReasoningLabel(label)}
        </div>
        <MarkdownText
          text={detail}
          className={cn(
            "text-[15px] leading-7 text-foreground/90",
            live && "animate-in fade-in-0 duration-200",
          )}
        />
      </div>
    </div>
  );
}

function SourceChip({ detail }: { detail: string }) {
  const [sourceName, ...rest] = detail.split(" — ");
  const title = rest.join(" — ");

  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {sourceName}
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground/85">
        {title || detail}
      </p>
    </div>
  );
}

function ThinkingSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-l border-border/60 pl-4">
      <div className="mb-3 h-3 w-32 animate-pulse rounded-full bg-muted/70" />
      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        <SkeletonLine width="w-2/5" />
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-[88%]" />
        <SkeletonLine width="w-3/5" />
      </div>
    </div>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div className={cn("h-3 animate-pulse rounded-full bg-muted/70", width)} />
  );
}

function formatReasoningLabel(label: string) {
  return label
    .replace(/\.live$/, "")
    .split(".")
    .map((part) => {
      if (!part) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function MarkdownText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-3", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}

function renderMarkdown(input: string) {
  const escaped = escapeHtml(input).replace(/\r/g, "");
  const blocks = escaped.split(/\n{2,}/).filter(Boolean);

  return blocks
    .map((block) => {
      if (/^```/.test(block.trim())) {
        const code = block
          .trim()
          .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
          .replace(/\n?```$/, "");

        return `<pre class="overflow-x-auto rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6"><code>${code}</code></pre>`;
      }

      const lines = block
        .split("\n")
        .map((line) => line.trimEnd())
        .filter(Boolean);

      if (lines.length === 0) {
        return "";
      }

      const headingMatch =
        lines.length === 1 ? lines[0].match(/^(#{1,6})\s+(.+)$/) : null;

      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 6);
        const text = renderInlineMarkdown(headingMatch[2]);
        const sizeClass =
          level <= 2
            ? "text-xl font-semibold"
            : level === 3
              ? "text-lg font-semibold"
              : "text-base font-semibold";

        return `<h${level} class="${sizeClass}">${text}</h${level}>`;
      }

      if (lines.every((line) => /^>\s?/.test(line))) {
        const quote = lines
          .map((line) => line.replace(/^>\s?/, ""))
          .map((line) => renderInlineMarkdown(line))
          .join("<br />");

        return `<blockquote class="border-l border-border/80 pl-4 text-foreground/80"><p>${quote}</p></blockquote>`;
      }

      if (lines.length === 1 && /^-{3,}$/.test(lines[0])) {
        return `<hr class="border-border/70" />`;
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        const items = lines
          .map((line) => line.replace(/^[-*]\s+/, ""))
          .map((line) => `<li>${renderInlineMarkdown(line)}</li>`)
          .join("");

        return `<ul class="list-disc space-y-2 pl-5">${items}</ul>`;
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        const items = lines
          .map((line) => line.replace(/^\d+\.\s+/, ""))
          .map((line) => `<li>${renderInlineMarkdown(line)}</li>`)
          .join("");

        return `<ol class="list-decimal space-y-2 pl-5">${items}</ol>`;
      }

      const html = lines
        .map((line) => renderInlineMarkdown(line))
        .join("<br />");

      return `<p>${html}</p>`;
    })
    .join("");
}

function renderInlineMarkdown(input: string) {
  return input
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="underline underline-offset-4 text-foreground">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 text-[0.95em]">$1</code>',
    );
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
