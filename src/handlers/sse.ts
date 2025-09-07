import { createRoom } from "../schema/types";

// クライアント管理マップ：roomId → Set of writers
const clients = new Map<string, Set<WritableStreamDefaultWriter>>();

export function pushToRoom(roomId: string, data: any) {
  const writers = clients.get(roomId);
  if (!writers) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const writer of writers) {
    writer.write(encoded).catch(() => {
      // エラー発生時は無視（切断されたなど）
    });
  }
}

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const roomId = params.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const writer = controller.getWriter();

      // 初回送信：status=waiting
      const room = createRoom(roomId);
      const payload = {
        roomId,
        query: params,
        status: room.status,
      };
      writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      // 接続登録
      if (!clients.has(roomId)) {
        clients.set(roomId, new Set());
      }
      clients.get(roomId)!.add(writer);

      // 切断時に登録解除
      stream.cancel = () => {
        clients.get(roomId)?.delete(writer);
      };
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