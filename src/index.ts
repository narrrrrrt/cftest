export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // まずアセット（./public 配下）を探す
    const assetResponse = await env.ASSETS.fetch(request);

    // もし 404 でなければ、そのまま返す（アセットが存在）
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // 404 だったら DO にフォワードする
    const url = new URL(request.url);
    const id = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    return stub.fetch(
      new Request(`http://do${url.pathname}${url.search}`, request)
    );
  },
};

// ReversiDO をエクスポート（必要に応じて）
export { ReversiDO } from "./ReversiDO";