// src/schema/types.ts
// ---------------------------------------------
// Room クラス定義
// - board(): ステータスに応じて盤面ビューを返す
// - setBoard(pos): 合法手なら適用して true、不正なら false
// - score(): 黒/白の石数を返す
// - 保存はプレーン(JSON)で行い、復元時にクラスへ戻す
// ---------------------------------------------

import {
  initialBoard,
  stripHints,
  computeLegalMoves,
  overlayLegalMoves,
  applyMove,
  type Pos,
} from "../utility/reversi";

// 盤面: 8行×各8文字、"-"|"B"|"W"|"*"
export type BoardRow = string;  // 長さ8を期待
export type Board = BoardRow[]; // 長さ8を期待

export type Status = "waiting" | "black" | "white" | "leave" | "ended";

export type Score = { black: number; white: number };

export class Room {
  id: string;
  status: Status;
  /** 生データの盤面（"-"|"B"|"W"|"*"）、保存対象 */
  boardData: Board;

  constructor(id: string) {
    this.id = String(id);
    this.status = "waiting";
    this.boardData = initialBoard();
  }

  /**
   * 表示用の盤面（副作用なし）
   * - waiting → 初期盤面
   * - black/white → 合法手を "*" でマーキング
   * - leave → 全部ハイフン
   * - ended → ヒントなし（そのまま）
   */
  board(): Board {
    if (this.status === "leave") {
      return Array.from({ length: 8 }, () => "--------");
    }

    const clean = stripHints(this.boardData);

    switch (this.status) {
      case "waiting":
        return initialBoard();

      case "black": {
        const moves: Pos[] = computeLegalMoves(clean, "B");
        return overlayLegalMoves(clean, moves, "*");
      }

      case "white": {
        const moves: Pos[] = computeLegalMoves(clean, "W");
        return overlayLegalMoves(clean, moves, "*");
      }

      case "ended":
      default:
        return clean;
    }
  }

  /**
   * アドレス指定で石を置く。
   * - 合法手なら盤面を更新して true
   * - 不正なら何もせず false
   */
  setBoard(pos: Pos): boolean {
    const turn =
      this.status === "black" ? "B" :
      this.status === "white" ? "W" :
      null;
    if (!turn) return false;

    const clean = stripHints(this.boardData);
    const moves = computeLegalMoves(clean, turn);
    const ok = moves.some(m => m.x === pos.x && m.y === pos.y);
    if (!ok) return false;

    const next = applyMove(clean, pos, turn);
    this.boardData = next;
    return true;
  }

  /**
   * 現在の石数を返す（ヒント"*"は無視）
   */
  score(): Score {
    const clean = stripHints(this.boardData);
    let black = 0, white = 0;
    for (const row of clean) {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === "B") black++;
        else if (c === "W") white++;
      }
    }
    return { black, white };
  }
}

/** ストレージ保存用のプレーン型（メソッドなし） */
export type RoomPlain = {
  id: string;
  status: Status;
  boardData: Board;
};

/** 保存時はプレーン化 */
export function toPlain(room: Room): RoomPlain {
  return { id: room.id, status: room.status, boardData: room.boardData };
}

/**
 * 読み出し時はクラスに復元
 * - 旧 board キーも boardData に吸収
 */
export function reviveRoom(
  raw: (Partial<RoomPlain> & { board?: Board }) | undefined,
  fallbackId: string
): Room {
  if (!raw) return new Room(fallbackId);

  const id = String(raw.id ?? fallbackId);
  const status = (raw.status ?? "waiting") as Status;
  const src = raw.boardData ?? raw.board;
  const boardData = validateBoard(src) ? (src as Board) : initialBoard();

  const room = new Room(id);
  room.status = status;
  room.boardData = boardData;
  return room;
}

/** 盤面の軽いバリデーション（8行×8文字、"-BW*" のみ） */
function validateBoard(b?: Board): b is Board {
  if (!b || b.length !== 8) return false;
  for (const row of b) {
    if (typeof row !== "string" || row.length !== 8) return false;
    if (/[^-BW*]/.test(row)) return false;
  }
  return true;
}

/** 互換API */
export function createRoom(id: string): Room {
  return new Room(id);
}