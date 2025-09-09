export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // clone を先に2つ作る
    const assetReq = request.clone();
    const doSrc    = request.clone();

    // 1) 静的アセット
    const res = await env.ASSETS.fetch(assetReq);
    if (res.status !== 404) return res;

    // 2) DO へフォワード（http://do に付け替え）
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    const doReq = new Request(
      `http://do${url.pathname}${url.search}`,
      { method: doSrc.method, headers: doSrc.headers, body: doSrc.body }
    );

    try {
      return await stub.fetch(doReq);
    } catch (e: any) {
      return new Response(JSON.stringify({ error: "DO fetch failed", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } });
    }
  }
};

export { ReversiDO } from "./ReversiDO";