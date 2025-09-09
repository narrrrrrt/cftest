export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // まず ASSETS に問い合わせ（HTML, CSS, JS, etc）
    const assetResponse = await env.ASSETS.fetch(request);

    // アセットが見つかればそれを返す（404 以外）
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // アセットが 404 → DO にフォワード（global ID）
    const id = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);


    try {
    // 元の URL を維持したまま DO にフォワード（パス・クエリ付き）
    return stub.fetch(new Request(`http://do${url.pathname}${url.search}`, request));
    } catch (e: any) {
      return new Response(
        JSON.stringify({
          error: "DO fetch failed",
          message: String(e?.message ?? e),
        }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
    
    
  },
};

// DO を export（wrangler.toml に書いてあれば必須）
export { ReversiDO } from "./ReversiDO";