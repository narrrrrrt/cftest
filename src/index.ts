// index.ts
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // --- 1) ボディを一度だけ安全に取り出す（GET/HEAD は無し） ---
    const isBodyless = request.method === "GET" || request.method === "HEAD";
    const buf = isBodyless ? undefined : await request.arrayBuffer();

    // ヘッダは新規インスタンスにコピー（元 headers を直接再利用しない）
    const copyHeaders = () => {
      const h = new Headers();
      request.headers.forEach((v, k) => h.set(k, v));
      return h;
    };

    // --- 2) まず ASSETS に投げる（body は buf の複製を渡す）---
    try {
      const assetReq = new Request(request, {
        // GET/HEAD では body を渡さないこと（undefined）
        body: buf ? buf.slice(0) : undefined,
        headers: copyHeaders(),
      });
      const assetRes = await env.ASSETS.fetch(assetReq);
      if (assetRes.status !== 404) {
        return assetRes;
      }
    } catch (e: any) {
      // アセット側での例外は DO 側へフォールバックする前に可視化
      return new Response(
        JSON.stringify({ error: "assets fetch failed", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    // --- 3) 404 のときだけ DO へフォワード（http://do に付け替え）---
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      const doReq = new Request(
        `http://do${url.pathname}${url.search}`,
        {
          method: request.method,
          headers: copyHeaders(),
          body: buf ? buf.slice(0) : undefined, // ← ASSETS とは別インスタンスを渡す
        }
      );
      return await stub.fetch(doReq);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "do fetch failed", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";