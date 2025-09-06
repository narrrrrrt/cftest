export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // /sse エンドポイント: SSEでクエリをそのまま返す
    if (url.pathname === "/sse") {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      writer.write(
        `data: ${JSON.stringify({ query: Object.fromEntries(url.searchParams) })}\n\n`
      );

      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
