// index.ts
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // DO へフォワード（global 固定）
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // 1) ボディを一度だけ ArrayBuffer に取り出す（GET/HEAD は body なし）
      const hasBody = !(request.method === "GET" || request.method === "HEAD");
      const buf = hasBody ? await request.arrayBuffer() : undefined;

      // 2) DO 用 URL に付け替えて、新しい Request を"素の init"で構築
      const doReq = new Request(
        `http://do${url.pathname}${url.search}`,
        {
          method: request.method,
          headers: request.headers,
          body: buf, // ← 新しいバッファを渡す（used body を完全回避）
        }
      );

      return await stub.fetch(doReq);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";