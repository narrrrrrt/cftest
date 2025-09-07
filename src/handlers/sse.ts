// handlers/sse.ts

import { Room, createRoom } from "../schema/types";

const clients = new Map<string, Set<WritableStreamDefaultWriter>>();
const rooms = new Map<string, Room>();

export function sse(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing room ID", { status: 400 });

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writers = clients.get(id) ?? new Set();
  writers.add(writer);
  clients.set(id, writers);

  if (!rooms.has(id)) {
    rooms.set(id, createRoom(id));
  }

  const room = rooms.get(id)!;
  writer.write(`data: ${JSON.stringify(room)}\n\n`);

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export function broadcast(id: string, data: any) {
  const writers = clients.get(id);
  if (!writers) return;

  for (const w of writers) {
    w.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}