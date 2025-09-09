export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // 1) アセットには clone を渡す（元の request は未消費のまま残す）
    const assetRes = await env.ASSETS.fetch(request.clone());
    if (assetRes.status !== 404) return assetRes;

    // 2) DO に渡すリクエストも "別の" clone を使う
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    const doReq = new Request(
      `http://do${url.pathname}${url.search}`,
      request.clone() // ← ここがポイント。同じ clone を使い回さない
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