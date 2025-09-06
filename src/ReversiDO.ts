export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    return new Response(`Hello from DO, id=${id}`, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export interface Env {}
