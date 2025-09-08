// src/handlers/sse.ts
import type { HandlerCtx } from "./core";

type Ctrl = ReadableStreamDefaultController;
const encoder = new TextEncoder();

// この DO（＝この room）内で使う接続バケツ（モジュール内に閉じる）
const buckets = new Map<string, Set<Ctrl>>();

function bucketFor(roomId: string): Set<Ctrl> {
  const key = String(roomId ?? "");
  let set = buckets.get(key);
  if (!set) {
    set = new Set<Ctrl>();
    buckets.set(key, set);
  }
  return set;
}

/**
 * この DO 内の全接続へブロードキャスト（自分も含む）。
 * 実装はこのモジュールに閉じる。core などから呼べるよう export。
 */
export function pushAll(data: unknown, _state?: DurableObjectState): void {
  const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const set of buckets.values()) {
    for (const ctrl of set) {
      try {
        ctrl.enqueue(chunk);
      } catch {
        // 壊れた接続は無視（必要なら除去ロジックを追加）
      }
    }
  }
}

/**
 * SSE エンドポイント
 * - start だけ（cancel なし）
 * - start では enqueue しない
 * - 接続登録後、初回通知は pushAll({ type: "init", entryParams }) で送る
 */
export async function sse(request: Request, ctx: HandlerCtx): Promise<Response> {
  const url = new URL(request.url, "http://do"); // 相対URL対策
  const entryParams = Object.fromEntries(url.searchParams.entries());
  const roomId = String(ctx.room.id);

  const stream = new ReadableStream({
    start(controller) {
      // 1) この room のバケツに登録
      const set = bucketFor(roomId);
      set.add(controller);

      // 2) 初回通知（自分も含め pushAll 経由で配信）
      pushAll({ type: "init", entryParams });
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