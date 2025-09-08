// src/handlers/reset.ts
import type { ActionHandler } from "./core";
import { resetRoomState } from "../schema/types";

export const resetAction: ActionHandler = async (_params, ctx) => {
  const room = await resetRoomState(ctx.state, ctx.room.id);

  const payload = {
    action: "reset",
    status: room.status,
    // board: room.board, // 返したいならここで付ける
  };

  return {
    broadcast: payload,                       // core.ts が pushAll してくれる
    response: { status: 200, body: payload },
  };
};