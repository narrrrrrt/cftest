// src/handlers/leave.ts
import type { ActionHandler } from "./core";

export const leaveAction: ActionHandler = async (params, ctx) => {
  const token = params?.body?.token as string | undefined;

  if (token) { // ★ トークンがある時だけ処理する（ここでブロック開始）
    ctx.room.leaveByToken(token);
    await ctx.save(ctx.room);

    const payload = {
      action: "leave",
      black: !!ctx.room.black,
      white: !!ctx.room.white,
      status: ctx.room.status,
      board: ctx.room.board(), // ← メソッド。score は載せない
    };

    return {
      broadcast: payload, // ★ トークンがある時だけブロードキャスト
      response: { status: 200, body: { ok: true } },
    };
  } // ★ ブロックここで閉じる

  // トークンが無い場合：何もしない（broadcast もしない）
  return { response: { status: 200, body: { ok: true } } };
};