// src/ReversiDO.ts
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

  /** URL から roomId を取得（相対URL対策あり） */
  private getRoomId(req: Request): string | null {
    const u = new URL(req.url, "http://do");
    return u.searchParams.get("id") ?? u.searchParams.get("roomId");
  }

  /** このリクエストは部屋IDが必要（SSE/各アクション） */
  private needsRoomId(): boolean {
    return true; // 本プロジェクトではすべて room 単位。不要なら細分化してOK
  }

  /** この DO（= この room）の Room オブジェクトを確保して返す */
  private async ensureRoom(roomId: string): Promise<Room> {
    // DO は roomId ごとに寄せられる想定なので、キーは固定でOK
    let room = await this.state.storage.get<Room>("room");
    if (!room) {
      room = createRoom(roomId);
      await this.state.storage.put("room", room);
    }
    return room;
  }

  private async saveRoom(room: Room): Promise<void> {
    await this.state.storage.put("room", room);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");
    const path = url.pathname;

    // 1) roomId を取得し、対象の DO インスタンスへ"寄せる"
    const needsId = this.needsRoomId();
    const roomId = needsId ? this.getRoomId(request) : null;
    if (needsId && !roomId) return new Response("missing id", { status: 400 });

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
      save: (r: Room) => this.saveRoom(r),
    };

    // 3) SSE は sse ハンドラへ。その他は core へ丸投げ（エンドポイント判定も core）
    if (path.startsWith("/sse")) {
      return sse(request, ctx);
    }
    return handleAction(request, ctx);
  }
}