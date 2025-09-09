import { initialBoard } from "../utility/reversi";
import type { HandlerCtx } from "../handlers/core";

export async function resetMethod(_params: any, ctx: HandlerCtx) {
  ctx.room.status = "waiting";
  ctx.room.boardData = initialBoard();
  ctx.room.step = 0;
  ctx.room.black = null;
  ctx.room.white = null;

  await ctx.save(ctx.room);

  return {
    broadcast: {
      action: "reset",
      board: ctx.room.board(),
      status: ctx.room.status,
      step: ctx.room.step,
    },
    response: { status: 200, body: { ok: true } },
  };
}