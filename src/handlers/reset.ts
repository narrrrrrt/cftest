import type { ActionHandler } from "./core";

export const resetAction: ActionHandler = async (params, state) => {
  const roomId = params.id;

  const payload = {
    action: "reset",
    roomId,
    // 必要なら初期盤面データなどを追加
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};