"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { rateTemplate, saveTemplate } from "./server";

type Product = {
  id: string;
  name: string;
  price: string;
};

export function TemplateReadyView({
  templateId,
  name,
  previewImageUrl,
  products,
  steps,
  initialRating,
}: {
  templateId: string;
  name: string;
  previewImageUrl: string | null;
  products: Product[];
  steps: string[];
  initialRating: number;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [isPending, startTransition] = useTransition();

  const handleRatingChange = (value: number) => {
    const previous = rating;
    setRating(value);

    startTransition(async () => {
      try {
        await rateTemplate({ templateId, rating: value });
      } catch (error) {
        console.error(error);
        setRating(previous);
        toast.error("Couldn't update rating.");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveTemplate({ templateId });
        toast.success("Saved to your looks.");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Couldn't save this look.");
      }
    });
  };

  return (
    <div
      className="relative grid h-svh lg:grid-cols-2"
      data-template-id={templateId}
    >
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-4 top-4 z-10 gap-1.5 shadow-sm"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="size-4" />
        Back Home
      </Button>

      <div className="relative h-svh bg-muted max-lg:h-[45vh]">
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt={`${name} preview`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Preview unavailable
          </div>
        )}
      </div>

      <div className="flex h-svh flex-col max-lg:h-auto">
        <div className="flex flex-col gap-4 px-6 pb-4 pt-6 md:px-10 md:pt-10">
          <h1 className="font-heading text-2xl font-bold">{name}</h1>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={`https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Card
                    size="sm"
                    className="gap-0 py-3 px-3 transition hover:border-foreground/40 hover:shadow-sm"
                  >
                    <CardContent className="flex items-center justify-between gap-2 px-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {product.name}
                      </p>
                      <p className="shrink-0 text-sm text-muted-foreground">
                        {product.price}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {steps.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 border-t border-border/60 px-6 py-4 md:px-10">
            <p className="text-base font-medium">To do this you do:</p>
            <p className="text-muted-foreground text-xs mb-2.5">
              AI results can make mistakes. Revalidate before following advice.
            </p>

            <ol className="list-decimal space-y-1 overflow-y-auto pl-5 text-sm">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <Separator />

        <div className="flex items-center justify-between gap-4 p-4 md:px-10">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rate makeup:</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleRatingChange(i + 1)}
                  disabled={isPending}
                  className="transition hover:scale-110 disabled:opacity-60"
                >
                  <Star
                    className={cn(
                      "size-5",
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
