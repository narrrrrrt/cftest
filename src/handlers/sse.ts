export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = () => {
        const data = JSON.stringify(params);
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
