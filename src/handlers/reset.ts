import type { ActionHandler } from "./core";
import { initialBoard } from "../utility/reversi";

export const resetAction: ActionHandler = async (_params, ctx) => {
  ctx.room.status = "waiting";
  ctx.room.boardData = initialBoard();
  ctx.room.step = 0;
  ctx.room.black = null;
  ctx.room.white = null;

  await ctx.save(ctx.room);

  const payload = {
    action: "reset",
    board: ctx.room.board(),   // ← メソッド呼び出しに注意
    score: ctx.room.score(),   // ← 任意だけど便利
    step: ctx.room.step,
    status: ctx.room.status,
  };

  return {
    broadcast: payload,
    response: { status: 200, body: { ok: true } },
  };
};