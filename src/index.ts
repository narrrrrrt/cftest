export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 1) 一度だけボディをバッファ化（GET/HEAD はボディ無し）
    const isBodyless = request.method === "GET" || request.method === "HEAD";
    const buf = isBodyless ? undefined : await request.arrayBuffer();

    // 2) ASSETS へ：元 request を使わず、新規 Request を組み立てて送る
    const assetReq = new Request(request, {
      // GET/HEAD のときは body を絶対に渡さない（undefined にする）
      body: buf ? buf.slice(0) : undefined,
    });
    const assetRes = await env.ASSETS.fetch(assetReq);
    if (assetRes.status !== 404) return assetRes;

    // 3) DO へ：DO 用 URL に付け替え、同じバッファから別体を渡す
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    const doReq = new Request(
      `http://do${url.pathname}${url.search}`,
      {
        method: request.method,
        headers: request.headers,
        body: buf ? buf.slice(0) : undefined, // ← ASSETS と別インスタンスを渡す
      }
    );

    try {
      return await stub.fetch(doReq);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "DO fetch failed", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";