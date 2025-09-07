import { createRoom } from "../schema/types";

// クライアント管理マップ：id → Set of controller
const clients = new Map<string, Set<ReadableStreamDefaultController>>();

export function pushToRoom(id: string, data: any) {
  const controllers = clients.get(id);
  if (!controllers) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const controller of controllers) {
    try {
      controller.enqueue(encoded);
    } catch (err) {
      controllers.delete(controller);
    }
  }
}

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const id = params.id;

  const encoder = new TextEncoder();
  const room = createRoom(id);
  const payload = {
    id,               // ← クエリーパラメーターそのまま
    query: params,    // ← 全てのパラメーターを含む
    status: room.status, // ← スキーマ準拠 ("waiting"など)
  };
  const initialData = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    start(controller) {
      // 初期メッセージを送信
      controller.enqueue(initialData);

      // クライアント登録（複数対応）
      if (!clients.has(id)) {
        clients.set(id, new Set());
      }
      clients.get(id)!.add(controller);
    },
    cancel() {
      // 切断時に自身を削除（あくまで弱い保証）
      clients.get(id)?.forEach(ctrl => {
        if (ctrl === this) {
          clients.get(id)!.delete(ctrl);
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}