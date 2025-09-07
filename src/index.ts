export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/do") {
      const id = env.ReversiDO.idFromName("global");
      const stub = env.ReversiDO.get(id);
      // クエリを維持して DO へフォワード
      return stub.fetch(new Request(`http://do${url.pathname}${url.search}`, request));
    }
    return new Response("Not found", { status: 404 });
  },
};

// Durable Object を再エクスポート
export { ReversiDO } from "./ReversiDO";