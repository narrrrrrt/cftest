import { Room } from "./types";

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
];

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
];

// 単一ルームの初期値を生成
export function createRoom(id: number): Room {
  return {
    id,
    status: "waiting",
    black: null,
    white: null,
    observers: [],
    board: [...initialBoard],
  };
}