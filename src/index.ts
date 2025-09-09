export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // いまは切り分けのため ASSETS は通さない前提

    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // ← doReq の生成そのものを try の中に入れる
      const doReq = new Request(
        `http://do${url.pathname}${url.search}`,
        request.clone()  // used body を避けるため必ず clone
      );

      const resp = await stub.fetch(doReq);
      return resp; // ここはそのまま返す（500でもキャッチはしない）
    } catch (e: any) {
      // ここに来たら「doReq生成」か「stub.fetch」のどちらかで落ちている
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";