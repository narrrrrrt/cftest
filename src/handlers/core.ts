// src/handlers/core.ts（コアの要点だけ・POST対応版） 
import { pushAll } from "./sse";
import type { Room } from "../schema/types";

export type HandlerCtx = {
  state: DurableObjectState;
  room: Room;
  save: (r: Room) => Promise<void>;
};
export type ActionResult = {
  response?: { status?: number; body?: unknown };
  broadcast?: unknown;
};
export type ActionHandler = (
  params: Record<string, string>,
  ctx: HandlerCtx
) => Promise<ActionResult>;

// ----------------------------------------------
// ルーター設定：動的インポート（1行追加で拡張）
// ----------------------------------------------
const importers: Record<
  string,
  () => Promise<{ default?: ActionHandler; [k: string]: unknown }>
> = {
  join: () => import("./join"),
  move: () => import("./move"),
  leave: () => import("./leave"),
  reset: () => import("./reset"),
  // 追加するときは ↑ に1行足すだけ（ファイルを置く → ここに1行）
};

// ----------------------------------------------
// 共通レスポンス（JSON）
// ----------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }
  );
}

// ----------------------------------------------
// エントリポイント（Core：ルーター兼ハブ）
//   - URLのBaseは DO 向けに "http://do" を決め打ち（重要な特徴）
//   - importers から動的ロード
//   - SSE pushAll は Core に集約
//   - GET/POST のパラメータ取り込み（今回の最小回収）
// ----------------------------------------------
export async function handleAction(
  request: Request,
  ctx: HandlerCtx
): Promise<Response> {
  // ★ 決め打ちBase（DOでの安定したURL解釈のために必須の特徴）
  const url = new URL(request.url, "http://do");

  // 先頭の "/" を剥がしてエンドポイント名を取得（例: "/join" → "join"）
  const name = url.pathname.slice(1);
  const importer = importers[name];
  if (!importer) {
    return json(
      { error: "unsupported endpoint", name, known: Object.keys(importers) },
      500
    );
  }

  const mod = await importer();
  const fn = (mod[`${name}Action`] ?? mod.default) as
    | ActionHandler
    | undefined;
  if (!fn) {
    return json(
      { error: "handler symbol not exported", expect: `${name}Action` },
      500
    );
  }

  // ----------------------------
  // パラメータ取得（最小回収ポイント）
  // 既存：GET クエリのみ → 変更：POST 本文もマージ
  //  - application/json
  //  - application/x-www-form-urlencoded
  //  - multipart/form-data
  // 失敗時は例外を投げず、従来どおり GET のみで継続
  // ----------------------------
  let params: Record<string, string> = Object.fromEntries(
    url.searchParams.entries()
  );

  if (request.method === "POST") {
    try {
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await request.json();
        if (body && typeof body === "object") {
          for (const [k, v] of Object.entries(
            body as Record<string, unknown>
          )) {
            if (v !== undefined && v !== null) params[k] = String(v);
          }
          // （注）配列/ネストは string 化して平坦化：既存型に合わせ互換優先
        }
      } else if (
        ct.includes("application/x-www-form-urlencoded") ||
        ct.includes("multipart/form-data")
      ) {
        const form = await request.formData();
        for (const [k, v] of form.entries()) params[k] = String(v);
      }
    } catch {
      // 本文パースに失敗しても既存挙動（GET クエリのみ）で続行
    }
  }

  // ハンドラ実行
  const result = await fn(params, ctx);

  // SSE ブロードキャストは Core に集約
  if (result?.broadcast !== undefined) pushAll(result.broadcast);

  // 共通 JSON で返す（デフォルト200 / { ok: true }）
  return json(
    result?.response?.body ?? { ok: true },
    result?.response?.status ?? 200
  );
}

// 必要に応じてデフォルトエクスポート（環境に合わせて選択）
export default handleAction;