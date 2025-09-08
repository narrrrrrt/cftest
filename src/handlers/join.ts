import type { ActionHandler } from "./core";

export const joinAction: ActionHandler = async (_params, ctx) => {
  const room = ctx.room;

  const payload = {
    action: "join",
    status: room.status,
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};