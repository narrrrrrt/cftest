export class ReversiDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url, "http://do");
    if (url.pathname === "/do") {
      const id = url.searchParams.get("id") || "unknown";

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const send = () => {
            const data = JSON.stringify({ ok: true, id });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          };

          send(); // 最初に即送信
          const interval = setInterval(send, 1000); // 1秒ごとに送信

          // 切断処理
          controller.signal.addEventListener("abort", () => {
            clearInterval(interval);
            controller.close();
          });
        },
      });

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "connection": "keep-alive",
        },
      });
    }

    return new Response("Not found in DO", { status: 404 });
  }
}