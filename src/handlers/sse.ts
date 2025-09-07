export async function sseHandler(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const id = url.searchParams.get("id") || "unknown";

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = () => {
        const data = JSON.stringify({ ok: true, id });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      send();
      const interval = setInterval(send, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}
