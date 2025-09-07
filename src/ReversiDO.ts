import { handleAction } from "./handlers/core";
import { sse } from "./handlers/sse";

const handlers: Record<string, Function> = { sse, join };

export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");
    const path = url.pathname.slice(1); // "/sse" → "sse"

    if (path === "sse") {
      // SSE の場合は既存処理をそのまま呼ぶ
      return sse(request);
    }

    // ★ここも join → core に差し替え
    return handleAction(request, this.state);
  }
}
