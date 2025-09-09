// src/usecases/joinMethod.ts
import type { HandlerCtx } from "../handlers/core";
import type { Room, Seat } from "../schema/types";

const genToken = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export async function joinMethod(params: any, ctx: HandlerCtx) {
  const room = ctx.room as Room;

  // 要求席（省略時は observer）
  const seatReq = String(params?.body?.seat ?? params?.seat ?? "observer") as Seat;

  // 毎回クライアント返却用のトークンを発行
  const token = genToken();

  // 1) まず現状から「最終ロール」を確定
  let role: Seat;
  if (seatReq === "black") {
    role = room.black ? "observer" : "black";
  } else if (seatReq === "white") {
    role = room.white ? "observer" : "white";
  } else {
    role = "observer";
  }

  // 2) ロールに応じて状態変更
  let changed = false;

  // 黒/白に座れるなら占有印として保存
  if (role === "black") { room.black = token; changed = true; }
  if (role === "white") { room.white = token; changed = true; }

  // leave 中にプレイヤーが入ってきた場合のみ waiting へ戻す
  if (role !== "observer" && room.status === "leave") {
    room.status = "waiting";
    changed = true;
  }

  // 両席そろっていて waiting ならゲーム開始（先手は黒）
  if (room.status === "waiting" && room.black && room.white) {
    room.status = "black";
    changed = true;
  }

  // 3) 変更があれば step++ と保存
  if (changed) {
    room.step += 1;
    await ctx.save(room);
  }

  // 4) Broadcast（SSE側はこの形）
  const broadcast = {
    type: "join",
    status: room.status,
    step:   room.step,
    black:  !!room.black,
    white:  !!room.white,
    board:  room.board(),
  };

  // 5) HTTP レスポンス（token / role / step）
  const response = {
    status: 200,
    body: { token, role, step: room.step },
  };

  return { broadcast, response };
}