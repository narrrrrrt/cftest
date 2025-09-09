// ReversiDO.ts
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

    const { id, params } = await this.getParams(request);

    let room = await this.ensureRoom(id ?? "default");
    if (typeof (room as any)?.leaveByToken !== "function" ||
        typeof (room as any)?.joinBySeat !== "function") {
      room = reviveRoom(room as any);
      await this.state.storage.put("room", toPlain(room));
    }

    const ctx: HandlerCtx = {
      state: this.state,
      room,
      save: async (r: Room) => {
        await this.state.storage.put("room", toPlain(r));
      }
    };
    
 console.log(JSON.stringify({LEAVE_DEBUG:1,hasRoom:!!ctx.room,ctor:String((ctx.room as any)?.constructor?.name),leaveFn:typeof (ctx.room as any)?.leaveByToken}));

    if (url.pathname.startsWith("/sse")) {
      return sse(request, ctx);
    }

    return handleAction(request, params, ctx);
  }

  private async ensureRoom(id: string): Promise<Room> {
    const raw = await this.state.storage.get<any>("room");
    if (raw) return reviveRoom(raw);
    const r = createRoom(id);
    await this.state.storage.put("room", toPlain(r));
    return r;
  }

  private async getParams(request: Request): Promise<{ id: string | null; params: Record<string, any> }> {
    const method = request.method.toUpperCase();
    if (method === "GET") {
      const u = new URL(request.url, "http://do");
      const params = Object.fromEntries(u.searchParams.entries());
      return { id: params.id ?? null, params };
    }
    if (method === "POST") {
      try {
        const body: any = await request.json();
        if (body && typeof body === "object") {
          return { id: body.id ?? null, params: body };
        }
      } catch {}
      return { id: null, params: {} };
    }
    return { id: null, params: {} };
  }
}

export default ReversiDO;
export { ReversiDO as ReversiDOExport };