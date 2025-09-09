import type { ActionHandler } from "./core";
import type { Seat } from "../schema/types";
import { leaveMethod } from "../usecases/leaveMethod";

export const leaveAction: ActionHandler = async (params, ctx) => {
  const token = params?.token != null ? String(params.token) : "";

export const leaveAction: ActionHandler = async (params, ctx) => {
  console.log(JSON.stringify({LEAVE_DEBUG:3,hasRoom:!!ctx.room,ctor:String((ctx.room as any)?.constructor?.name),leaveFn:typeof (ctx.room as any)?.leaveByToken}));
  const token = params?.token ?? "";
  …
};

  if (!token) {
    return {
      response: { status: 400, body: { error: "missing token" } }
    };
  }

  // トークンに対応する参加者を退室させ、部屋状態を更新
  await leaveMethod(ctx, token);

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
      body: { ok: true, step: ctx.room.step }
    }
  };
};

export default leaveAction;