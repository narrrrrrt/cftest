import type { HandlerCtx } from "../handlers/core";

export async function leaveMethod(params: any, ctx: HandlerCtx) {
  const token = params?.body?.token as string | undefined;

  if (token) {
    ctx.room.leaveByToken(token);
    await ctx.save(ctx.room);

    return {
      broadcast: {
        action: "leave",
        black: !!ctx.room.black,
        white: !!ctx.room.white,
        status: ctx.room.status,
        board: ctx.room.board(),
      },
      response: { status: 200, body: { ok: true } },
    };
  }

  return { response: { status: 200, body: { ok: true } } };
}