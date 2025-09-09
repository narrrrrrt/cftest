export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // DO へ直行（global 固定）
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // GET/HEAD 以外はボディを一度だけ完全取得（再利用可能なデータ化）
      const bodyInit =
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(); // ← text() でも OK。ポイントは "再送可能なデータ"

      // ★ ここが肝：Request を作らず、init で直接渡す
      return await stub.fetch(
        `http://do${url.pathname}${url.search}`,
        {
          method: request.method,
          headers: request.headers,
          body: bodyInit
        }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";