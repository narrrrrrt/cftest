// ※ ここは封印前提。将来は基本いじらない。
// 追加アクションは "SUPPORTED_PATHS" と import の行を増やすだけ。

import { joinAction }  from "./join";
import { moveAction }  from "./move";   // ← stub 前提（未実装なら 501）
import { leaveAction } from "./leave";  // ← stub 前提（未実装なら 501）
import { resetAction } from "./reset";  // ← stub 前提（未実装なら 501）

// ──────────────────────────────────────────────
// サポートするパス（将来ここに追記する）
// ──────────────────────────────────────────────
export const SUPPORTED_PATHS = ["join", "move", "leave", "reset"] as const;
type SupportedAction = (typeof SUPPORTED_PATHS)[number];

// 共通型（ここだけで完結）
export type ActionResult = {
  broadcast?: unknown;
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
};
export type ActionHandler = (
  params: Record<string, string>,
  state?: DurableObjectState
) => Promise<ActionResult> | ActionResult;

// 実装テーブル（未実装は undefined で良い）
const ACTIONS: Partial<Record<SupportedAction, ActionHandler>> = {
  join:  joinAction,
  move:  moveAction,
  leave: leaveAction,
  reset: resetAction,
};

// 既存 join.ts と同じ URL 構築（DO依存）。絶対に変えない。
export async function handleAction(request: Request, state?: DurableObjectState): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const path = url.pathname.replace(/^\/+/, "");

  // action は path 優先、次いで ?action=
  const requested = (path || params.action) as string;

  // 許可パス以外は 400（ここで弾く）
  if (!SUPPORTED_PATHS.includes(requested as SupportedAction)) {
    return json({ error: "unsupported path", path: requested, allowed: SUPPORTED_PATHS }, 400);
  }

  const handler = ACTIONS[requested as SupportedAction];

  // ハンドラ未実装（stub）の場合は 501
  if (typeof handler !== "function") {
    return json({ error: "not implemented yet", action: requested }, 501);
  }

  // 実処理へ
  const result = await handler(params, state);

  // 既存の pushAll 呼び出し位置は維持（broadcast があれば）
  if (result && result.broadcast !== undefined) {
    pushAll(result.broadcast, state);
  }

  // 応答は既存構造を踏襲
  const status  = result?.response?.status ?? 200;
  const headers = { "content-type": "application/json", ...(result?.response?.headers || {}) };
  const body    = result?.response?.body ?? { ok: true };

  return new Response(JSON.stringify(body), { status, headers });
}

// 既存の pushAll（定義元そのまま）。ここから呼べるように宣言だけ。
declare function pushAll(data: unknown, state?: DurableObjectState): void;

// 小ユーティリティ（既存挙動に影響なし）
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}