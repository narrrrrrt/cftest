import { createRoom } from "../schema/types";

const clients = new Map<string, WritableStreamDefaultWriter>();

export function pushToRoom(roomId: string, data: any) {
  const writer = clients.get(roomId);
  if (!writer) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  writer.write(encoded).catch(() => {
    clients.delete(roomId); // 切断済みなど
  });
}

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const roomId = params.id;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  clients.set(roomId, writer); // ✅ クライアント登録

  const encoder = new TextEncoder();
  const room = createRoom(roomId);
  const payload = {
    roomId,
    query: params,
    status: room.status,
  };

  writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)); // ✅ await 不要

  return new Response(readable, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}