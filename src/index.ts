export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 明示的にパスだけを使って ASSETS に問い合わせる
    const assetRequest = new Request(url.pathname, request);
    const assetResponse = await env.ASSETS.fetch(assetRequest);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // fallback to DO
    const id = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);
    return stub.fetch(new Request(`http://do${url.pathname}${url.search}`, request));
  },
};

export { ReversiDO } from "./ReversiDO";