// src/handlers/core.ts（コアの要点だけ）
import { pushAll } from "./sse";
import type { Room } from "../schema/types";
import { readParams } from "../utility/params";

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
  const params = await readParams(request);
  const result = await fn(params, ctx);

  if (result?.broadcast !== undefined) pushAll(result.broadcast);

  return json(result?.response?.body ?? { ok:true }, result?.response?.status ?? 200);
}