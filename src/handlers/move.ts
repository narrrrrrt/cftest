import type { ActionHandler } from "./core";

export const moveAction: ActionHandler = async (params, state) => {
  const roomId = params.id;

  const payload = {
    action: "move",
    roomId,
    // 必要に応じて x, y, color などの move 固有データを追加
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};