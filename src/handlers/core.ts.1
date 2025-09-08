// src/handlers/core.ts
// 既存方針：エンドポイントの有無や 404/500 判定は core 側の責務
import { joinAction }  from "./join";
import { moveAction }  from "./move";
import { leaveAction } from "./leave";
import { resetAction } from "./reset";
import { pushAll } from "./sse";
import type { Room } from "../schema/types";

export const SUPPORTED_PATHS = ["join", "move", "leave", "reset"] as const;
export type SupportedAction = (typeof SUPPORTED_PATHS)[number];

export type HandlerCtx = {
  state: DurableObjectState;
  room: Room;
  save: (room: Room) => Promise<void>;
};

export type ActionResult = {
  response?: { status?: number; body?: unknown };
  broadcast?: unknown;
};

export type ActionHandler = (
  params: Record<string, string>,
  ctx: HandlerCtx
) => Promise<ActionResult>;

function parseParams(url: URL): Record<string, string> {
  const p: Record<string, string> = {};
  for (const [k, v] of url.searchParams) p[k] = v;
  return p;
}

export async function handleAction(
  request: Request,
  ctx: HandlerCtx
): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const name = url.pathname.slice(1); // "/move" → "move"

  if (!SUPPORTED_PATHS.includes(name as SupportedAction)) {
    return json({ error: "unsupported endpoint" }, 500);
  }

  const params = parseParams(url);

  const table: Record<SupportedAction, ActionHandler> = {
    join:  joinAction,
    move:  moveAction,
    leave: leaveAction,
    reset: resetAction,
  };

  const handler = table[name as SupportedAction];
  const result  = await handler(params, ctx);
  const status  = result?.response?.status ?? 200;
  const body    = result?.response?.body ?? { ok: true };

  if (result?.broadcast !== undefined) {
    pushAll(result.broadcast);
  }


  // 必要ならここで ctx.room を見てブロードキャストの加工も可能
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}