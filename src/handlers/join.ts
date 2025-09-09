import type { ActionHandler } from "./core";
import type { Seat } from "../schema/types";
import { joinMethod } from "./joinMethod";

export const joinAction: ActionHandler = async (params, ctx) => {
  const seat = String(params?.seat ?? "observer") as Seat;

  const { token, role } = await joinMethod(ctx, seat);

  return {
    broadcast: {
      type: "state",
      status: ctx.room.status,
      step: ctx.room.step,
      black: !!ctx.room.black,
      white: !!ctx.room.white,
      board: ctx.room.board(),
    },
    response: {
      status: 200,
      body: { token, role, step: ctx.room.step },
    },
  };
};

export default joinAction;