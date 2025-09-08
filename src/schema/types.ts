// src/schema/types.ts
// ---------------------------------------------
// Room クラス定義（保存はプレーンJSON、復元でクラス化）
// - board(): ステータスに応じた表示用盤面（合法手 "*" 付き等）
// - setBoard(pos): 合法なら着手して true、不正なら false
// - score(): 黒/白の石数
// - startIfReady(): 両者そろい & waiting → 先手黒で開始（step=1）
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
export type BoardRow = string;
export type Board = BoardRow[];

export type Status = "waiting" | "black" | "white" | "leave" | "ended";
export type Score  = { black: number; white: number };

export class Room {
  id: string;
  status: Status;
  /** 生データ盤面（保存対象：" - B W * "）。常に 8 行 × 各 8 文字を想定 */
  boardData: Board;
  /** 座席（ID/名前など無ければ null） */
  black: string | null;
  white: string | null;
  /** 手数（未開始は 0、開始で 1 からスタート） */
  step: number;

  constructor(id: string) {
    this.id = String(id);
    this.status = "waiting";
    this.boardData = initialBoard();
    this.black = null;
    this.white = null;
    this.step  = 0; // ★ null ではなく 0 に変更
  }

  /**
   * 両者そろっていて waiting なら開始状態に遷移。
   * 先手は黒、step=1 をセット。状態を変更したら true。
   */
  startIfReady(): boolean {
    if (this.status === "waiting" && this.black && this.white) {
      this.status = "black";
      this.step = 1;
      return true;
    }
    return false;
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
        const moves = computeLegalMoves(clean, "B");
        return overlayLegalMoves(clean, moves, "*");
      }
      case "white": {
        const moves = computeLegalMoves(clean, "W");
        return overlayLegalMoves(clean, moves, "*");
      }

      case "ended":
      default:
        return clean;
    }
  }

  /**
   * アドレス指定で石を置く。
   * - 合法手なら反映して true
   * - 不正なら未変更で false
   */
  setBoard(pos: Pos): boolean {
    const turn =
      this.status === "black" ? "B" :
      this.status === "white" ? "W" : null;
    if (!turn) return false;

    const clean = stripHints(this.boardData);
    const moves = computeLegalMoves(clean, turn);
    const ok = moves.some(m => m.x === pos.x && m.y === pos.y);
    if (!ok) return false;

    const next = applyMove(clean, pos, turn);
    this.boardData = next;
    // 手番/step の更新は move ハンドラ側で行う想定
    return true;
  }

  /** 現在の石数（"*" は無視） */
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

/** ストレージ保存用プレーン型（メソッドなし） */
export type RoomPlain = {
  id: string;
  status: Status;
  boardData: Board;
  black: string | null;
  white: string | null;
  step: number;
};

/** 保存時はプレーン化 */
export function toPlain(room: Room): RoomPlain {
  return {
    id: room.id,
    status: room.status,
    boardData: room.boardData,
    black: room.black,
    white: room.white,
    step: room.step,
  };
}

/**
 * 読み出し時はクラスに復元（旧 board キーも吸収）
 */
export function reviveRoom(
  raw: (Partial<RoomPlain> & { board?: Board }) | undefined,
  fallbackId: string
): Room {
  if (!raw) return new Room(fallbackId);

  const room = new Room(String(raw.id ?? fallbackId));
  room.status    = (raw.status ?? "waiting") as Status;
  const src      = raw.boardData ?? raw.board;
  room.boardData = validateBoard(src) ? (src as Board) : initialBoard();
  room.black     = (raw.black ?? null) as string | null;
  room.white     = (raw.white ?? null) as string | null;
  room.step      = (raw.step  ?? 0) as number; // null の場合は 0 にフォールバック
  return room;
}

/** 盤面の軽い検証（8行×8文字、"-BW*" のみ） */
function validateBoard(b?: Board): b is Board {
  if (!b || b.length !== 8) return false;
  for (const row of b) {
    if (typeof row !== "string" || row.length !== 8) return false;
    if (/[^-BW*]/.test(row)) return false;
  }
  return true;
}

/** 互換API（既存コード移行用） */
export function createRoom(id: string): Room {
  return new Room(id);
}