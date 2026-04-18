import { auth } from "@clerk/nextjs/server";

import { loadProcessingSnapshot } from "../data";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: RouteContext<"/dashboard/makeup/[templateId]/processing/events">,
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { templateId } = await ctx.params;

  if (!UUID_PATTERN.test(templateId)) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastPayload = "";

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        controller.close();
      };

      request.signal.addEventListener("abort", close);

      const loop = async () => {
        while (!closed) {
          const snapshot = await loadProcessingSnapshot({
            ownerId: userId,
            templateId,
          });

          if (!snapshot) {
            send("error", { message: "Processing job not found" });
            close();
            return;
          }

          const { elapsedSeconds: _elapsedSeconds, ...comparableSnapshot } =
            snapshot;
          const payload = JSON.stringify(comparableSnapshot);

          if (payload !== lastPayload) {
            lastPayload = payload;
            send("snapshot", snapshot);
          } else {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          }

          if (
            snapshot.templateStatus === "ready" ||
            snapshot.templateStatus === "failed"
          ) {
            close();
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      };

      void loop().catch((error) => {
        if (closed) {
          return;
        }

        send("error", {
          message:
            error instanceof Error ? error.message : "Unexpected stream error",
        });
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
