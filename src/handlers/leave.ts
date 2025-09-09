import type { ActionHandler } from "./core";
import { leaveMethod } from "../usecases/leaveMethod";

export const leaveAction: ActionHandler = async (params, ctx) => {
  const token = params?.body?.token as string | undefined;

  // トークン無し：何もしない＆ブロードキャストしない
  if (!token) {
    return { response: { status: 200, body: { ok: true } } };
  }

  await leaveMethod(ctx, token);

  return {
    broadcast: {
      type:   "leave",
      status: ctx.room.status,
      step:   ctx.room.step,
      black:  !!ctx.room.black,
      white:  !!ctx.room.white,
      board:  ctx.room.board(),
    },
    response: {
      status: 200,
      body: { ok: true },
    },
  };
};

export default leaveAction;