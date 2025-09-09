import type { HandlerCtx } from "../handlers/core";
import type { Room } from "../schema/types";
import { initialBoard } from "../utility/reversi";

/**
 * leaveMethod:
 * - token に一致する参加者を退席させる
 * - 両席空なら waiting へ初期化（board/step をリセット）
 * - 片席残なら status=leave
 * - 状態が変わったら step++ して保存
 * - 返り値は void（removed 等は返さない）
 */
export async function leaveMethod(ctx: HandlerCtx, token: string): Promise<void> {
  const room = ctx.room as Room;
  if (!token) return; // 仕様：トークン無しは何もしない

  let changed = false;

  if (room.black === token) { room.black = null; changed = true; }
  if (room.white === token) { room.white = null; changed = true; }

  if (!changed) return; // 該当なしなら何もしない

  if (!room.black && !room.white) {
    // 両者不在 → 完全初期化
    room.status = "waiting";
    room.step   = 0;
    room.boardData = initialBoard();
  } else {
    // どちらか在席 → 中断状態へ
    room.status = "leave";
  }

  room.step += 1;
  await ctx.save(room);
}