import type { ActionHandler } from "./core";

export const leaveAction: ActionHandler = async (_params, ctx) => {
  const room = ctx.room;

  const payload = {
    action: "leave",
    status: room.status,
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};