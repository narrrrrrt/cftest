// sse.ts
import type { HandlerCtx } from "./core";

// 部屋IDごとにコネクション(Writer)を束ねる
const channels = new Map<string, Set<WritableStreamDefaultWriter<Uint8Array>>>();
const te = new TextEncoder();

/**
 * クライアントからの SSE 接続ハンドラ
 * - 同じ DO インスタンス内で、ctx.room.id をキーに接続を束ねます
 * - 接続直後に hello を1発送ります（疎通確認用）
 */
export function sse(request: Request, ctx: HandlerCtx): Response {
  const roomId = String((ctx as any).room?.id ?? "default");

  // 送信用のストリームを用意（readable をレスポンスに返し、writable に書き込む）
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  // 部屋のコネクションセットへ登録
  let set = channels.get(roomId);
  if (!set) {
    set = new Set();
    channels.set(roomId, set);
  }
  set.add(writer);

  // 接続直後に1発（任意の初期イベント）
  writer.write(te.encode(`data: ${JSON.stringify({ type: "hello", roomId })}\n\n`)).catch(() => {});

  // レスポンス（SSEヘッダ）
  const response = new Response(readable, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      // CORS が必要なら下を有効化
      // "access-control-allow-origin": "*",
    },
  });

  // クライアント切断時のクリーンアップ
  // Cloudflare ではクライアント切断で write が throw するので、
  // 実際の削除は pushAll 側の write 失敗時にも行います。
  // 念のためレスポンス閉鎖のフックを試みる:
  (response as any)?.webSocket?.closed?.finally?.(() => {
    try { set!.delete(writer); } catch {}
  });

  return response;
}

/**
 * 指定 roomId に接続中の全クライアントへイベントを配信
 * @returns 実際に送れた接続数
 */
export function pushAll(roomId: string, data: unknown): number {
  const set = channels.get(roomId);
  if (!set || set.size === 0) return 0;

  const payload = te.encode(`data: ${JSON.stringify(data)}\n\n`);
  let delivered = 0;
  const dead: WritableStreamDefaultWriter<Uint8Array>[] = [];

  for (const w of set) {
    try {
      w.write(payload);
      delivered++;
    } catch {
      // 切断済みの writer を掃除
      dead.push(w);
    }
  }
  if (dead.length) {
    for (const w of dead) set.delete(w);
    if (set.size === 0) channels.delete(roomId);
  }
  return delivered;
}