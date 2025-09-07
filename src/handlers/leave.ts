import type { ActionHandler } from "./core";
import { createRoom } from "../schema/types";
import { pushAll } from "./sse";

export const leaveAction: ActionHandler = async (params, state) => {
  const roomId = params.id;
  const room = await createRoom(roomId /*, state*/);

  const payload = {
    action: "leave",
    roomId,
    status: room.status,
    // seat: params.seat, // 必要なら
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};