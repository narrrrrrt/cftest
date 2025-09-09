export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // DO
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // 1) ヘッダを新規コピー（オリジナルと切り離す）
      const headers = new Headers();
      request.headers.forEach((v, k) => headers.set(k, v));

      // 2) ボディは再送可能なデータに（まずは text() で）
      let body: BodyInit | undefined;
      if (request.method !== "GET" && request.method !== "HEAD") {
        body = await request.text(); // ← ArrayBuffer でも可。まずは text で切り分け
      }

      // 3) Request を new しない。init で直接渡す
      return await stub.fetch(
        `http://do${url.pathname}${url.search}`,
        { method: request.method, headers, body }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";