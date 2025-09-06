export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // まずは静的アセットを探す
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // アセットに無ければ DO にフォワード
    const url = new URL(request.url);
    const id = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    // クエリパラメータを維持したまま転送
    return stub.fetch(new Request(`http://do${url.pathname}${url.search}`, request));
  },
};

// Durable Object を再エクスポート
export { ReversiDO } from "./ReversiDO";
