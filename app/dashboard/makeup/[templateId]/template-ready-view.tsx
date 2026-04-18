"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";

export function TemplateReadyView({
  templateId,
}: {
  templateId: string;
}) {
  const [rating, setRating] = useState(4);

  const name = "Natural Glow";
  const products = [
    { id: "p1", name: "makeup 1", price: "2$" },
    { id: "p2", name: "makeup 1", price: "2$" },
  ];
  const steps = ["blah", "blah", "blah"];

  return (
    <div
      className="grid min-h-svh lg:grid-cols-2"
      data-template-id={templateId}
    >
      <div className="relative bg-muted">
        <img
          src="https://blocks.astratic.com/img/general-img-square.png"
          alt="Preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="flex max-w-md flex-col gap-6">
            <h1 className="font-heading text-2xl font-bold">{name}</h1>

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

            <div className="flex flex-col gap-2">
              <p className="text-base font-medium">to do this you do:</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
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
                  onClick={() => setRating(i + 1)}
                  className="transition hover:scale-110"
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
          <Button variant="outline">Save</Button>
        </div>
      </div>
    </div>
  );
}
