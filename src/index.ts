export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 1) 静的アセットへ（ここでは必ず clone したものを渡す）
    const assetRes = await env.ASSETS.fetch(request.clone());
    if (assetRes.status !== 404) return assetRes;

    // 2) DO にフォワード（バインディング名はどちらでも拾う）
    const id    = DO_NS.idFromName("global");
    const stub  = DO_NS.get(id);

    // ★ "disturbed" を避けるコツ：init を素のオブジェクトに展開する
    //    new Request(url, request) とせず、method/headers/body を明示
    const doReq = new Request(
      `http://do${url.pathname}${url.search}`,
      {
        method: request.method,
        headers: request.headers,
        // request.body は 1 回も読んでいなければそのまま渡せる（ASSETS には clone を使ったので未消費）
        body: request.body,
        // 既定の他オプション（redirect 等）は request から勝手に取らない
        // ここに keepalive/signal 等は不要（最小修正）
      }
    );

    try {
      return await stub.fetch(doReq);
    } catch (e: any) {
      // 最小の可視化だけ
      return new Response(
        JSON.stringify({ error: "DO fetch failed", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

// DO の export（既存通り）
export { ReversiDO } from "./ReversiDO";