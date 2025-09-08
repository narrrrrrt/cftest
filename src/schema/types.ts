// src/schema/types.ts
// ---------------------------------------------
// Room クラス定義（保存はプレーンJSON、復元でクラス化）
// - startIfReady(): 両者そろい & waiting/leave → 先手黒で開始（step=1）
// - joinByToken(token, seat): 参加（auto/black/white）。片席のみ→status=leave
// - board(): ステータスに応じた表示用盤面（合法手 "*" 付き等）
// - setBoard(pos): 合法なら着手して true、不正なら false
// - score(): 黒/白の石数
// - leaveByToken(token): 退室（両席空→waitingに初期化、片席残→status=leave）
// - snapshot(): SSE 用共通ペイロード
// - toPlain / reviveRoom: シリアライズ/デシリアライズ補助
// ---------------------------------------------

import {
  initialBoard,
  stripHints,
  computeLegalMoves,
  overlayLegalMoves,
  applyMove,
  type Pos,
} from "../utility/reversi";

// usecases を import & re-export（ファイル分割のため）
import { joinMethod }  from "../usecases/joinMethod";
import { moveMethod }  from "../usecases/moveMethod";
import { leaveMethod } from "../usecases/leaveMethod";
import { resetMethod } from "../usecases/resetMethod";
export { joinMethod, moveMethod, leaveMethod, resetMethod };

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
  /** 座席（ID/名前など。未在席なら null） */
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
    this.step  = 0; // 0 なら falsy。++ しても数値のまま
  }

  /** 両者そろっていて waiting/leave なら開始状態へ遷移（先手は黒・step=1） */
  startIfReady(): boolean {
    if ((this.status === "waiting" || this.status === "leave") && this.black && this.white) {
      this.status = "black";
      this.step = 1;
      return true;
    }
    return false;
  }

  /**
   * 参加：token を指定座席に割り当てる（auto=空いてる方に入れる）。
   * - 既に同じ token が着席済みなら idempotent（必要なら startIfReady だけ実行）
   * - 明示 seat が埋まっていれば変更しない（false）
   * - auto は黒→白の優先で空きを探す
   * - 両者そろえば startIfReady()。片席のみなら status=leave
   */
  joinByToken(token: string, seat: "black" | "white" | "auto" = "auto"): boolean {
    if (!token) return false;

    // 既に同じ token が座っている場合は変更なし（開始判定だけ）
    if (this.black === token || this.white === token) {
      return this.startIfReady();
    }

    const assign = (s: "black" | "white") => {
      if (s === "black") {
        if (!this.black) { this.black = token; return true; }
      } else {
        if (!this.white) { this.white = token; return true; }
      }
      return false;
    };

    let changed = false;
    if (seat === "black" || seat === "white") {
      changed = assign(seat);
    } else {
      changed = assign("black") || assign("white");
    }
    if (!changed) return false;

    // 座席結果に応じたステータス整備
    if (this.black && this.white) {
      this.startIfReady(); // waiting/leave → black & step=1
    } else {
      this.status = "leave"; // 片席のみ → 盤面は board() で非表示（全ハイフン）
    }
    return true;
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
   * - 合法手なら盤面を更新して true
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
    // 手番のトグルやパス判定、step++ は move ハンドラ側で実施
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

  /**
   * 退室処理：token に一致する参加者を取り除き、必要なら waiting/leave に整える
   * - 観戦者配列なし前提（使うなら適宜追加）
   */
  leaveByToken(token: string): void {
    let touched = false;
    if (this.black === token) { this.black = null; touched = true; }
    if (this.white === token) { this.white = null; touched = true; }
    if (touched) this.normalizeAfterLeave();
  }

  /** 退室後の最小調整：両席空→waiting/初期化、片席残→status=leave */
  private normalizeAfterLeave(): void {
    const noPlayers = !this.black && !this.white;
    if (noPlayers) {
      this.status = "waiting";
      this.step = 0;
      this.boardData = initialBoard();
    } else {
      this.status = "leave";
    }
  }

  /** SSE 用の共通スナップショット */
  snapshot() {
    return {
      step: this.step,
      black: !!this.black,
      white: !!this.white,
      status: this.status,
      board: this.board(), // ← 常にメソッド
    };
  }
}

// ---------------------------------------------
// 永続化用ヘルパー
// ---------------------------------------------
export type RoomPlain = {
  id: string;
  status: Status;
  boardData: Board;
  black: string | null;
  white: string | null;
  step: number;
};

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
  room.step      = (raw.step  ?? 0) as number;
  return room;
}

function validateBoard(b?: Board): b is Board {
  if (!b || b.length !== 8) return false;
  for (const row of b) {
    if (typeof row !== "string" || row.length !== 8) return false;
    if (/[^-BW*]/.test(row)) return false;
  }
  return true;
}

export function createRoom(id: string): Room {
  return new Room(id);
}