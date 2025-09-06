export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/sse") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response("Invalid room id", { status: 400 });
      }

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // 接続直後に初期メッセージを送信
      writer.write(`data: connected with id=${id}\n\n`);

      // 例として5秒ごとにハートビート
      const interval = setInterval(() => {
        writer.write(`data: heartbeat from ${id} @ ${new Date().toISOString()}\n\n`);
      }, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        writer.close();
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}