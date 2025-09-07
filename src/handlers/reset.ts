import type { ActionHandler } from "./core";
import { createRoom } from "../schema/types"; // ← 修正済み

export const resetAction: ActionHandler = async (params, state) => {
  const roomId = params.id;
  const room = await createRoom(roomId /*, state*/);

  const payload = {
    action: "reset",
    roomId,
    status: room.status,
    // 必要なら初期盤面データを追加
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};