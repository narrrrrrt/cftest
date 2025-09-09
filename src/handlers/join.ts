import type { ActionHandler } from "./core";
import { joinMethod } from "../usecases/joinMethod";
import type { Seat } from "../schema/types";

export const joinAction: ActionHandler = async (params, ctx) => {
  const seat = String(params?.body?.seat ?? params?.seat ?? "observer") as Seat;

  const { token, role } = await joinMethod(ctx, seat);

  return {
    broadcast: {
      type:   "join",
      status: ctx.room.status,
      step:   ctx.room.step,
      black:  !!ctx.room.black,
      white:  !!ctx.room.white,
      board:  ctx.room.board(),
    },
    response: {
      status: 200,
      body: { token, role, step: ctx.room.step },
    },
  };
};

export default joinAction;