import { createRoom } from "../schema/types";

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // クエリの id をそのまま文字列で渡す
      const id = params.id;
      const room = createRoom(id);

      const payload = {
        roomId: id,
        query: params,
        status: room.status,
      };

      const data = JSON.stringify(payload);
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
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