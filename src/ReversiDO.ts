// src/ReversiDO.ts
import type { DurableObjectState } from "@cloudflare/workers-types";
import { createRoom, reviveRoom, toPlain, type Room } from "./schema/types";
import { handleAction, type HandlerCtx } from "./handlers/core";
import { sse } from "./handlers/sse";

export class ReversiDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");

    // GET=URL、POST=JSON をここで一度だけ読む
    const { id, params } = await this.getParams(request);

    // ★★ 1) Room は必ずクラスに"復活"させて渡す
    const room = await this.ensureRoom(id ?? "default");

    const ctx: HandlerCtx = {
      state: this.state,
      room,
      // ★★ 2) 保存は常に toPlain（次回 revive でメソッド復活）
      save: async (r: Room) => {
        await this.state.storage.put("room", toPlain(r));
      }
    };

    // SSE は別ハンドラ
    if (url.pathname.startsWith("/sse")) {
      return sse(request, ctx);
    }

    // ★★ 3) core へは params を必ず渡す（ここがデグレしやすい）
    return handleAction(request, params, ctx);
  }

  // GET は URL クエリ、POST は JSON（form は非対応）
  private async getParams(request: Request): Promise<{ id: string | null; params: Record<string, any> }> {
    const m = request.method.toUpperCase();
    if (m === "GET") {
      const u = new URL(request.url, "http://do");
      const params = Object.fromEntries(u.searchParams.entries());
      const id = params.id ?? null;
      return { id, params };
    }
    if (m === "POST") {
      try {
        const parsed: any = await request.json();
        const id = parsed?.id ?? null;
        return { id, params: (parsed && typeof parsed === "object") ? parsed : {} };
      } catch {
        return { id: null, params: {} };
      }
    }
    return { id: null, params: {} };
  }

  // 既存があれば revive、なければ create → toPlain で保存
  private async ensureRoom(id: string): Promise<Room> {
    const key = "room";
    const raw = await this.state.storage.get<any>(key);
    if (raw) {
      return reviveRoom(raw);
    }
    const r = createRoom(id);
    await this.state.storage.put(key, toPlain(r));
    return r;
  }
}