import type { ActionHandler } from "./core";

export const leaveAction: ActionHandler = async (params, state) => {
  const roomId = params.id;

  const payload = {
    action: "leave",
    roomId,
    // 必要なら seat 情報などを追加
  };

  return {
    broadcast: payload,
    response: { status: 200, body: payload },
  };
};