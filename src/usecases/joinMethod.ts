// src/usecases/joinMethod.ts
import type { HandlerCtx } from "../handlers/core";

/**
 * joinMethod:
 * - body.token を座席に割り当て（seat が無ければ "auto"）
 * - 変更があった時だけ保存
 * - SSE は snapshot() を展開（board は Room.board() 由来）
 * - token 無しは何もしない（broadcast なし）
 */
export async function joinMethod(params: any, ctx: HandlerCtx) {
  const token = params?.body?.token as string | undefined;
  const seat =
    (params?.body?.seat as "black" | "white" | "auto" | undefined) ?? "auto";

  if (!token) {
    return { response: { status: 200, body: { ok: true } } };
  }

  const changed = ctx.room.joinByToken(token, seat);
  if (changed) {
    await ctx.save(ctx.room);
  }

  return {
    broadcast: { action: "join", ...ctx.room.snapshot() },
    response: { status: 200, body: { ok: true } },
  };
}