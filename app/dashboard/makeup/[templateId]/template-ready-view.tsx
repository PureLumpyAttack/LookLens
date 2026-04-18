"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
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
      className="grid min-h-svh lg:grid-cols-2"
      data-template-id={templateId}
    >
      <div className="relative bg-muted">
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

      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="flex max-w-md flex-col gap-6">
            <h1 className="font-heading text-2xl font-bold">{name}</h1>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <Card key={product.id} size="sm" className="gap-0 py-0">
                    <div className="aspect-square bg-muted" />
                    <Separator />
                    <CardContent className="py-3 text-center">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.price}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}

            {steps.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">to do this you do:</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>

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
                        : "fill-muted text-muted"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
