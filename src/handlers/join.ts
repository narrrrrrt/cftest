// src/handlers/join.ts
import type { ActionHandler } from "./core";

export const joinAction: ActionHandler = async (params, ctx) => {
  const token = params?.body?.token as string | undefined;
  const seat  = (params?.body?.seat as "black"|"white"|"auto"|undefined) ?? "auto";

  if (token) {
    const changed = ctx.room.joinByToken(token, seat);
    if (changed) await ctx.save(ctx.room);

    return {
      broadcast: { action: "join", ...ctx.room.snapshot() },
      response:  { status: 200, body: { ok: true } },
    };
  }

  // token 無しは何もしない（broadcast なし）
  return { response: { status: 200, body: { ok: true } } };
};

export default joinAction;