// handlers/core.ts
import { pushAll } from "./sse";
// あなたの実装に合わせて import を調整してください
// Room 型はクラス（メソッド付き）であること
import type { Room } from "../schema/types";
import type { DurableObjectState } from "@cloudflare/workers-types";

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
  params: Record<string, any>,
  ctx: HandlerCtx
) => Promise<ActionResult>;

const importers: Record<string, () => Promise<{ default?: ActionHandler; [k: string]: unknown }>> = {
  join:  () => import("./join"),
  leave: () => import("./leave"),
  move:  () => import("./move"),
  reset: () => import("./reset"),
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleAction(
  request: Request,
  params: Record<string, any>,
  ctx: HandlerCtx
): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const name = url.pathname.replace(/^\/+/, "");

  const importer = importers[name];
  if (!importer) {
    return json({ error: "unsupported endpoint", name, known: Object.keys(importers) }, 404);
  }

  const mod = await importer();
  const fn = (mod[`${name}Action`] ?? mod.default) as ActionHandler | undefined;
  if (!fn) {
    return json({ error: "handler symbol not exported", expect: `${name}Action` }, 500);
  }

  const result = await fn(params, ctx);

  if (result?.broadcast !== undefined) {
    pushAll(ctx.room.id as unknown as string, result.broadcast);
  }

  return json(result?.response?.body ?? { ok: true }, result?.response?.status ?? 200);
}

export default handleAction;