export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do"); // ベース必須
    if (url.pathname === "/do") {
      const id = url.searchParams.get("id");
      return new Response(JSON.stringify({ ok: true, id }), {
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("Not found in DO", { status: 404 });
  }
}
