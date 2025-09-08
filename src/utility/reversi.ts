// src/utility/reversi.ts
// ---------------------------------------------
// Reversi/Othello 純ロジック（副作用なし）
// - Board は 8行×各8文字の string[]（"-"|"B"|"W"|"*"）
// - "*" はヒント。計算時は空きマス扱いにする
// ---------------------------------------------

export type BoardRow = string;         // 長さ8を期待
export type Board = BoardRow[];        // 長さ8を期待
export type Disc = "B" | "W";
export type Pos = { x: number; y: number }; // x=列(0..7), y=行(0..7)

// 8方向
const DIRS: ReadonlyArray<Pos> = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y:  0 },                  { x: 1, y:  0 },
  { x: -1, y:  1 }, { x: 0, y:  1 }, { x: 1, y:  1 },
];

// ---------- 基本ツール ----------
function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}
function safeClone(board: Board): Board {
  // すでに各行は文字列なのでスライスで十分
  return board.slice(0);
}
function getCell(board: Board, x: number, y: number): string {
  const row = board[y];
  return row?.[x] ?? "-";
}
function setCell(row: string, x: number, v: string): string {
  // 行文字列の x 位置を書き換えて返す
  return row.substring(0, x) + v + row.substring(x + 1);
}
function opponent(p: Disc): Disc { return p === "B" ? "W" : "B"; }

// ---------- 公開API ----------

/** 初期盤面（中央4マス：D4=E5= W, E4=D5= B） */
export function initialBoard(): Board {
  const rows = Array.from({ length: 8 }, () => "--------");
  // 0-index: (3,3) W, (4,4) W, (3,4) B, (4,3) B
  rows[3] = setCell(rows[3], 3, "W");
  rows[4] = setCell(rows[4], 4, "W");
  rows[3] = setCell(rows[3], 4, "B");
  rows[4] = setCell(rows[4], 3, "B");
  return rows;
}

/** 既存のヒント "*" をすべて "-" に落とす（表示をクリア） */
export function stripHints(board: Board): Board {
  const out = new Array<string>(8);
  for (let y = 0; y < 8; y++) {
    const row = board[y] ?? "--------";
    out[y] = row.replace(/\*/g, "-");
  }
  return out;
}

/**
 * 合法手を計算（座標配列）
 * - 入力の "*" は空きマスとして扱う
 * - 8方向、相手石1枚以上を挟んで自石にぶつかる空マス
 */
export function computeLegalMoves(board: Board, player: Disc): Pos[] {
  const clean = stripHints(board);
  const opp = opponent(player);
  const moves: Pos[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (getCell(clean, x, y) !== "-") continue; // 空きのみ候補
      let ok = false;

      for (const d of DIRS) {
        let cx = x + d.x, cy = y + d.y;
        let foundOpp = false;

        // まず相手石が1枚以上続く必要
        while (inBounds(cx, cy) && getCell(clean, cx, cy) === opp) {
          cx += d.x; cy += d.y;
          foundOpp = true;
        }
        if (!foundOpp) continue;

        // その先に自石があれば合法
        if (inBounds(cx, cy) && getCell(clean, cx, cy) === player) {
          ok = true;
          break;
        }
      }

      if (ok) moves.push({ x, y });
    }
  }

  return moves;
}

/** 合法手を "*" で焼き込んだ盤面を返す（非破壊） */
export function overlayLegalMoves(board: Board, moves: Pos[], mark = "*"): Board {
  const clean = stripHints(board);
  const out = safeClone(clean);
  for (const { x, y } of moves) {
    if (!inBounds(x, y)) continue;
    if (getCell(out, x, y) === "-") {
      out[y] = setCell(out[y], x, mark);
    }
  }
  return out;
}

/**
 * 実際に着手を適用して新盤面を返す（非破壊）
 * - pos が合法でない場合、元の盤面をそのまま返す
 */
export function applyMove(board: Board, pos: Pos, player: Disc): Board {
  const clean = stripHints(board);
  const { x, y } = pos;
  if (!inBounds(x, y) || getCell(clean, x, y) !== "-") return clean;

  const opp = opponent(player);
  let flippedAny = false;
  let next = safeClone(clean);

  for (const d of DIRS) {
    const flips: Pos[] = [];
    let cx = x + d.x, cy = y + d.y;

    // 相手石を収集
    while (inBounds(cx, cy) && getCell(next, cx, cy) === opp) {
      flips.push({ x: cx, y: cy });
      cx += d.x; cy += d.y;
    }
    // 1枚も相手石がない / はみ出した / 自石で止まらない → この方向は無効
    if (flips.length === 0) continue;
    if (!inBounds(cx, cy) || getCell(next, cx, cy) !== player) continue;

    // この方向は有効：flips を反転
    flippedAny = true;
    for (const f of flips) {
      const r = next[f.y];
      next[f.y] = setCell(r, f.x, player);
    }
  }

  // どの方向もひっくり返らないなら不正手 → 元の盤面
  if (!flippedAny) return clean;

  // 着手点を自石にする
  next[y] = setCell(next[y], x, player);
  return next;
}