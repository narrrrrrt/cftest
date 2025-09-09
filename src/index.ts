export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // DO にフォワード（global ID）
    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // clone して method/headers/body を展開
      const r = request.clone();
      const doReq = new Request(
        `http://do${url.pathname}${url.search}`,
        {
          method: r.method,
          headers: r.headers,
          body: (r.method === "GET" || r.method === "HEAD") ? undefined : r.body
        }
      );

      const resp = await stub.fetch(doReq);
      return resp;
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";