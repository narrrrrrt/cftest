// types.ts ---- 最小I/O仕様 + step 付き（id: string）

export type GameStatus = "waiting" | "black" | "white" | "pass" | "leave" | "finish"
export type Seat = "black" | "white" | "observer"

export interface Room {
  id: string              // ルームID
  status: GameStatus      // 現在の状態
  black: string | null    // 黒の使用者ID/null=空席
  white: string | null    // 白の使用者ID/null=空席
  observers: string[]     // 観戦者ID
  board: string[]         // 8行盤面（"."|"B"|"W"）
  step: number            // 状態更新ごとに+1
}

export interface SseSnapshot {
  step: number
  black: boolean
  white: boolean
  status: GameStatus
  board: string[]
}

export interface JoinResponse {
  role: Seat              // black | white | observer
  token: string           // JOIN時のみ発行
  step: number
}

export interface MoveResponse {
  status: "ok" | "illegal_move" | "not_your_turn" | "invalid_token"
}

export interface LeaveResponse {
  status: "ok" | "invalid_token"
}

// 完全クリア盤面
export const emptyBoard: string[] = [
  "--------",
  "--------",
  "--------",
  "--------",
  "--------",
  "--------",
  "--------",
  "--------",
]

// ゲーム開始盤面
export const initialBoard: string[] = [
  "--------",
  "--------",
  "--------",
  "---WB---",
  "---BW---",
  "--------",
  "--------",
  "--------",
]

// 単一ルームの初期値を生成
export function createRoom(id: string): Room {
  return {
    id,
    status: "waiting",
    black: null,
    white: null,
    observers: [],
    board: [...initialBoard],
    step: 0,
  }
}

export async function resetRoomState(
  state: DurableObjectState,
  roomId: string
): Promise<Room> {
  await state.storage.deleteAll();              // 他のキーも含めて全クリアでOK（部屋=DO前提）
  const room = createRoom(roomId);
  await state.storage.put("room", room);
  return room;
}