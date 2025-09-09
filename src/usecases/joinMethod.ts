import type { HandlerCtx } from "../handlers/core";
import type { Room, Seat } from "../schema/types";

const genToken = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

/**
 * joinMethod:
 * - seat 希望に基づきロールを確定（埋まってたら observer）
 * - 黒/白に座れた場合のみ token を占有印として保存
 * - status が leave のとき、プレイヤー着席なら waiting へ戻す
 * - 両席そろって waiting なら先手 black で開始
 * - 何か変わったときだけ step++ して保存
 * - 返り値は { token, role } のみ
 */
export async function joinMethod(
  ctx: HandlerCtx,
  seat: Seat
): Promise<{ token: string; role: Seat }> {
  const room = ctx.room as Room;
  const token = genToken();

  // 1) ロールを決定（現状の空席状況で確定）
  let role: Seat;
  if (seat === "black") {
    role = room.black ? "observer" : "black";
  } else if (seat === "white") {
    role = room.white ? "observer" : "white";
  } else {
    role = "observer";
  }

  // 2) 反映（何か変わったら step++ & save 対象）
  let changed = false;

  if (role === "black") { room.black = token; changed = true; }
  if (role === "white") { room.white = token; changed = true; }

  // leave中にプレイヤーが入ってきたら waiting に戻す（observer は除外）
  if (role !== "observer" && room.status === "leave") {
    room.status = "waiting";
    changed = true;
  }

  // 両席そろって waiting ならゲーム開始（先手は黒）
  if (room.status === "waiting" && room.black && room.white) {
    room.status = "black";
    changed = true;
  }

  if (changed) {
    room.step += 1;
    await ctx.save(room);
  }

  return { token, role };
}