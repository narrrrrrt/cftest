import { createRoom } from "../schema/types";

// 単一接続用 controller（※1人想定）
let controller: ReadableStreamDefaultController | null = null;

// 他の処理からSSEにデータを送信するための関数
export function pushToRoom(id: string, data: any) {
  if (!controller) return;
  const encoder = new TextEncoder();
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}

export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const id = params.id;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;  // ← グローバルに保存
      const encoder = new TextEncoder();
      const room = createRoom(id);
      const payload = {
        id,
        query: params,
        status: room.status,
      };
      ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
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