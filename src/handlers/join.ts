import type { ActionHandler } from "./core";
import { createRoom } from "../schema/types"; 


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