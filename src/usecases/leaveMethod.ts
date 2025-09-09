import type { HandlerCtx } from "../handlers/core";
import type { Room, Seat } from "../schema/types";

export const leaveMethod: ActionHandler = async (params, ctx) => {
  const token = params?.token != null ? String(params.token) : "";

console.log(JSON.stringify({LEAVE_DEBUG:true,hasRoom:!!ctx.room,ctor:(ctx.room as any)?.constructor?.name,leaveFn:typeof (ctx.room as any)?.leaveByToken}));

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