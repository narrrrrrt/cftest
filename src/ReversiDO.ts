// src/ReversiDO.ts
import type { DurableObjectState } from "@cloudflare/workers-types";
import { reviveRoom, toPlain, type Room } from "./schema/types";
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
    const path = url.pathname;

    // 1) 一度だけパラメータを作る（GET=URL、POST=JSON）
    const { id, params } = await this.getParams(request);

    // 2) ルームを用意して ctx 作成
    const room = await this.ensureRoom(id);
    const ctx: HandlerCtx = {
      state: this.state,
      room,
      save: async (r) => { await this.state.storage.put("room", toPlain(r)); }
    };

    // 3) SSE は別ハンドラ、それ以外は core に委譲
    if (path.startsWith("/sse")) {
      return sse(request, ctx);
    }
    return handleAction(request, params, ctx);
  }

  private async getParams(request: Request): Promise<{ id: string | null; params: Record<string, any> }> {
    const m = request.method.toUpperCase();
    if (m === "GET") {
      const url = new URL(request.url, "http://do");
      const params = Object.fromEntries(url.searchParams.entries());
      const id = params.id != null ? String(params.id) : null;
      return { id, params };
    }
    if (m === "POST") {
      let parsed: any = {};
      try {
        parsed = await request.json(); // ← JSON だけ読む（1回だけ）
      } catch { parsed = {}; }
      const id = parsed?.id != null ? String(parsed.id) : null;
      return { id, params: (parsed && typeof parsed === "object") ? parsed : {} };
    }
    return { id: null, params: {} };
  }

  private async ensureRoom(id: string | null): Promise<Room> {
    const key = "room";
    const raw = await this.state.storage.get<any>(key);
    if (!raw) {
      // 初期生成（ID 未指定でもとりあえず部屋を作る想定ならここで作成）
      const init: Room = reviveRoom({ /* 初期プレーン */ } as any, id ?? "default");
      await this.state.storage.put(key, toPlain(init));
      return init;
    }
    return reviveRoom(raw as any, id ?? "default");
  }
}