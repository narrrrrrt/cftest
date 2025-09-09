// src/ReversiDO.ts
import { Room, RoomPlain, reviveRoom, toPlain } from "./schema/types"; // ←パスは環境に合わせて
import type { Env } from "./schema/types";
import { createRoom, type Room } from "./schema/types";
import { sse } from "./handlers/sse";
import { handleAction, type HandlerCtx } from "./handlers/core";

export class ReversiDO {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private getRoomId(req: Request): string | null {
    const u = new URL(req.url, "http://do");
    return u.searchParams.get("id");
  }

  private async ensureRoom(roomId: string): Promise<Room> {
    // 保存されているプレーンデータを取得
    const raw = await this.state.storage.get<RoomPlain>("room");

    if (!raw) {
      // 初回：新品を作って"プレーン"で保存
      const room = new Room(roomId);
      await this.state.storage.put("room", toPlain(room));
      return room; // ← クラスインスタンス（board() が使える）
    }

    // 既存あり：プレーン → クラスに復元（board()/setBoard() 復活）
    const room = reviveRoom(raw, roomId);
    return room;
  }

  private async saveRoom(room: Room): Promise<void> {
    await this.state.storage.put("room", room);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");
    const path = url.pathname;

    // 1) roomId を取得し、対象の DO インスタンスへ"寄せる"
    const roomId = this.getRoomId(request);
    if (!roomId) return new Response("missing id", { status: 400 });

    if (roomId) {
      const targetId = this.env.ReversiDO.idFromName(roomId);
      const selfId = (this.state.id as any).toString?.() ?? String(this.state.id);
      const tgtId  = (targetId as any).toString?.() ?? String(targetId);
      if (String(selfId) !== String(tgtId)) {
        const stub = this.env.ReversiDO.get(targetId);
        return stub.fetch(request);
      }
    }

    // 2) このインスタンスが対象：room を DO 側で用意して handlers に"渡す"
    const room = await this.ensureRoom(roomId!);
    const ctx: HandlerCtx = {
      state: this.state,
      room,
      save: async (r) => { await this.state.storage.put("room", toPlain(r)); }
    };

    // 3) SSE は sse ハンドラへ。その他は core へ丸投げ（エンドポイント判定も core）
    if (path.startsWith("/sse")) {
      return sse(request, ctx);
    }
    return handleAction(request, ctx);
  }
}