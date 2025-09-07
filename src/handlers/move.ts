import type { ActionHandler } from "./core";
import { createRoom } from "../schema/types"; // ← 修正済み

export const moveAction: ActionHandler = async (params, state) => {
  const roomId = params.id;
  const room = await createRoom(roomId /*, state*/);

  const payload = {
    action: "move",
    roomId,
    status: room.status,
    // 例: x: Number(params.x), y: Number(params.y), color: params.color
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};