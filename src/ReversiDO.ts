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

          send();
          const interval = setInterval(send, 1000);

          // ❌ 不要だった abort 処理 → 削除
          // ✅ 接続が切れたら Cloudflare が自動で stream を閉じる
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