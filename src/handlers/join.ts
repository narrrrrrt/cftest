import type { ActionHandler } from "./core";
import { createRoom } from "../schema";  // 既存 join.ts と同じ import 元に合わせる

export const joinAction: ActionHandler = async (params, state) => {
  const roomId = params.id;

  const room = await createRoom(roomId /*, state*/);

  const payload = {
    action: "join",
    roomId,
    status: room.status,
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};