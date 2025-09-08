// src/handlers/move.ts
import type { ActionHandler } from "./core";

export const moveAction: ActionHandler = async (params, ctx) => {
  const room = ctx.room;

  const payload = {
    action: "move",
    status: room.status,
  };

  return {
    broadcast: payload, // 同一 DO = 同一 room だけに配られる（SSE 側が分離）
    response: { status: 200, body: payload },
  };
};