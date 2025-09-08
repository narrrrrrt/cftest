// join.ts ---- ctx.room 前提・最小I/O仕様 
import type { ActionHandler } from "./core"
import type { Room, Seat, GameStatus, SseSnapshot, JoinResponse } from "../schema/types"

const genToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) // 簡易

export const joinAction: ActionHandler = async (params, ctx) => {
  const room = ctx.room as Room                               // 事前に解決済みのルーム
  const seat = String(params.seat || "observer") as Seat      // "black" | "white" | "observer"

  let role: Seat = seat
  let changed = false

  if (seat === "black") {
    if (room.black) role = "observer"
    else { room.black = genToken(); changed = true }          // 占有印（内部IDでOK）
  } else if (seat === "white") {
    if (room.white) role = "observer"
    else { room.white = genToken(); changed = true }
  } else {
    role = "observer"
  }

  if (room.status === "waiting" && room.black && room.white) {
    room.status = "black"                                     // 先手は黒
    changed = true
  }

  if (changed) room.step += 1                                  // 変化があれば step+1

  await ctx.save(room);
  
  const snapshot: SseSnapshot = {                              // 全員に同じSSE
    step: room.step,
    black: !!room.black,
    white: !!room.white,
    status: room.status as GameStatus,
    board: room.board,
  }

  const resp: JoinResponse = {                                 // JOIN時のみ role/token/step
    role,
    token: genToken(),
    step: room.step,
  }

  return {
    broadcast: snapshot,
    response: { status: 200, body: resp },
  }
}