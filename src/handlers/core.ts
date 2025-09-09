// src/handlers/core.ts（コアの要点だけ）
import { pushAll } from "./sse";
import type { Room } from "../schema/types";

// ===== 追加: POSTボディ読取ヘルパー ここから =====
async function readBody(request: Request): Promise<Record<string, any> | null> {
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const json = await request.json();
      return (json && typeof json === "object") ? json : { value: json };
    }
    if (ct.includes("application/x-www-form-urlencoded")) {
      const fd = await request.formData();
      return Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, typeof v === "string" ? v : String(v)]));
    }
    if (ct.includes("multipart/form-data")) {
      const fd = await request.formData();
      // ファイル等はここでは扱わず、文字情報のみ拾う最小実装
      const entries: [string, string][] = [];
      for (const [k, v] of fd.entries()) {
        entries.push([k, typeof v === "string" ? v : (v as File).name]);
      }
      return Object.fromEntries(entries);
    }
  } catch (_e) {
    // 読み取り失敗時は null（既存 GET 経路を壊さない）
  }
  return null;
}
// ===== 追加: POSTボディ読取ヘルパー ここまで =====

export type HandlerCtx = { state: DurableObjectState; room: Room; save: (r: Room)=>Promise<void>; };
export type ActionResult = { response?: { status?: number; body?: unknown }, broadcast?: unknown };
export type ActionHandler = (params: Record<string,string>, ctx: HandlerCtx) => Promise<ActionResult>;

// ★ "動的風"インポート・ファクトリ（パスはリテラルなので安全）
const importers: Record<string, () => Promise<{ default?: ActionHandler; [k: string]: unknown }>> = {
  join:  () => import("./join"),
  move:  () => import("./move"),
  leave: () => import("./leave"),
  reset: () => import("./reset"),
  // 追加するときは ↑ に1行足すだけ（ファイル置く → ここに1行）
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type":"application/json" } });
}

export async function handleAction(request: Request, ctx: HandlerCtx): Promise<Response> {
  const url  = new URL(request.url, "http://do");
  const name = url.pathname.slice(1);              // "join" など
  const importer = importers[name];
  if (!importer) return json({ error:"unsupported endpoint", name, known:Object.keys(importers) }, 500);

  const mod = await importer();
  const fn = (mod[`${name}Action`] ?? mod.default) as ActionHandler | undefined;
  if (!fn) return json({ error:"handler symbol not exported", expect:`${name}Action` }, 500);

  //const params = Object.fromEntries(url.searchParams.entries());
  // ---- 元の行（クエリ→params）をコメントアウト ----
  // ===== 追加: GET/POST 両対応の params 組み立て ここから =====
  const params: any = Object.fromEntries(url.searchParams.entries());

  if (request.method === "POST") {
    const body = await readBody(request);
    if (body && typeof body === "object") {
      // 1) body 全体は params.body に温存（join.ts が参照するため）
      (params as any).body = body;

      // 2) よく使うキーはフラットにも反映（クエリ優先＝既存キーがあれば上書きしない）
      const bubbleUpKeys = ["seat", "name", "token", "room", "board", "lang"];
      for (const k of bubbleUpKeys) {
        if (params[k] === undefined && body[k] !== undefined) {
          params[k] = body[k];
        }
      }
    }
  }
  // ===== 追加: GET/POST 両対応の params 組み立て ここまで =====
  
  const result = await fn(params, ctx);

  if (result?.broadcast !== undefined) pushAll(result.broadcast);

  return json(result?.response?.body ?? { ok:true }, result?.response?.status ?? 200);
}