// schema/types.ts

export interface Room {
  id: string;
  status: "waiting" | "playing" | "finished";
  black: string | null;
  white: string | null;
  observers: string[];
  board: string[];
}

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

export function createRoom(id: string): Room {
  return {
    id,
    status: "waiting",
    black: null,
    white: null,
    observers: [],
    board: [...initialBoard],
  };
}