export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    const id   = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    try {
      // GET/HEAD は body を持たない
      let body: BodyInit | undefined = undefined;
      if (!(request.method === "GET" || request.method === "HEAD")) {
        const buf = await request.arrayBuffer();
        // ArrayBuffer → Uint8Array → 新しい ReadableStream にする
        body = new Uint8Array(buf);
      }

      const doReq = new Request(
        `http://do${url.pathname}${url.search}`,
        {
          method: request.method,
          headers: request.headers,
          body
        }
      );

      return await stub.fetch(doReq);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "index catch", message: String(e?.message ?? e) }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};

export { ReversiDO } from "./ReversiDO";