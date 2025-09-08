import type { ActionHandler } from "./core";

export const resetAction: ActionHandler = async (_params, ctx) => {
  const room = ctx.room;

  const payload = {
    action: "reset",
    status: room.status,
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};