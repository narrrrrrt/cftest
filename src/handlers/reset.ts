import type { ActionHandler } from "./core";
import { initialBoard } from "../utility/reversi";

export const resetAction: ActionHandler = async (_params, ctx) => {
  // ① データを初期状態に
  ctx.room.status = "waiting";
  ctx.room.boardData = initialBoard();

  // ② 保存（toPlain は ctx.save 側でやる想定）
  await ctx.save(ctx.room);

  // ③ ブロードキャストは board() を使う
  const payload = {
    action: "reset",
    board: ctx.room.board(),     // ← ここが変更点
    score: ctx.room.score(),     // （あれば載せると便利）
  };

  return {
    broadcast: payload,
    response: { status: 200, body: { ok: true } }, // レスポンスに盤面は載せない方針のまま
  };
};