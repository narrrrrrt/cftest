import { createRoom } from "../schema/types";

// ✅ 複数接続対応（Setで管理）
const clients = new Map<string, Set<WritableStreamDefaultWriter>>();

export function pushToRoom(roomId: string, data: any) {
  const writers = clients.get(roomId);
  if (!writers) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const writer of writers) {
    writer.write(encoded).catch(() => {
      // 書き込み失敗時に Set から削除（例：接続切れ）
      writers.delete(writer);
    });
  }
}

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const roomId = params.id;

  // ✅ TransformStream を使って Writer を取り出す
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // ✅ クライアント Writer を登録（Set に追加）
  if (!clients.has(roomId)) {
    clients.set(roomId, new Set());
  }
  clients.get(roomId)!.add(writer);

  // 最初のステータスを送信
  const encoder = new TextEncoder();
  const room = createRoom(roomId);
  const payload = {
    roomId,
    query: params,
    status: room.status,
  };
  writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

  // ❌ cancel 処理は明示的に書かない（不安定・自己参照を避ける）

  return new Response(readable, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}