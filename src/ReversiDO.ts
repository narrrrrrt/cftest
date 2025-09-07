import { sse } from "./handlers/sse";
import { join } from "./handlers/join";
// import { move } from "./handlers/move";
// import { leave } from "./handlers/leave";
// import { reset } from "./handlers/reset";

const handlers: Record<string, Function> = { sse, join };

export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");
    const path = url.pathname.slice(1); // "/sse" → "sse"

    if (path in handlers) {
      return handlers[path](request);
    }

    return new Response("Not found in DO", { status: 404 });
  }
}
