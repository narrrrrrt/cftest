import type { HandlerCtx } from "../handlers/core";

export const leaveMethod: ActionHandler = async (params, ctx) => {
  const token = params?.token != null ? String(params.token) : "";

  const changed = ctx.room.leaveByToken(token);

  if (changed) {
    // 変更があったときだけ step++
    ctx.room.step += 1;
    await ctx.save(ctx.room);

    return {
      broadcast: {
        type: "leave",
        status: ctx.room.status,
        step: ctx.room.step,
        black: !!ctx.room.black,
        white: !!ctx.room.white,
        board: ctx.room.board(),
      },
      response: {
        status: 200,
        body: { ok: true }
      }
    };
  }

  // 空振りのときも 200 を返す（非リーク）
  return {
    response: {
      status: 200,
      body: { ok: true }
    }
  };
};

export default leaveAction;