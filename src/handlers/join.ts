// join.ts ---- idは受け取った文字列をそのままストレージキーに使う
import type { ActionHandler } from "./core"
import type { Room, Seat, GameStatus, SseSnapshot, JoinResponse } from "../schema/types"
import { createRoom } from "../schema/types"

const genToken = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) // 簡易トークン

export const joinAction: ActionHandler = async (params, state) => {
  const roomId = String(params.id)                           // もらったIDをそのまま使う
  const seat = String(params.seat || "observer") as Seat     // 希望seat

  let room = await state.storage.get<Room>(roomId)           // そのままキーにする
  if (!room) room = createRoom(roomId)

  let role: Seat = seat
  let changed = false

  if (seat === "black") {
    if (room.black) role = "observer"
    else { room.black = genToken(); changed = true }
  } else if (seat === "white") {
    if (room.white) role = "observer"
    else { room.white = genToken(); changed = true }
  } else {
    role = "observer"
  }

  if (room.status === "waiting" && room.black && room.white) {
    room.status = "black"                                    // 先手は黒
    changed = true
  }

  if (changed) room.step += 1

  await state.storage.put(roomId, room)                      // そのままIDで保存

  const snapshot: SseSnapshot = {                            // SSE用フルスナップショット
    step: room.step,
    black: !!room.black,
    white: !!room.white,
    status: room.status as GameStatus,
    board: room.board,
  }

  const resp: JoinResponse = {                               // HTTP応答（JOIN時のみ role/token/step）
    role,
    token: genToken(),                                       // 実運用ではroomId+roleに紐づく発行に変更可
    step: room.step,
  }

  return {
    broadcast: snapshot,                                     // 全員に同じSSE
    response: { status: 200, body: resp },
  }
}