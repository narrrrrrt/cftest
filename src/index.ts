import { ReversiDO } from "./ReversiDO";

export { ReversiDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Durable Object の ID を固定的に取得
    const id = env.ReversiDO.idFromName("global");
    const stub = env.ReversiDO.get(id);

    // クエリパラメータ付きリクエストをそのまま DO に転送
    return stub.fetch(request);
  },
};

export interface Env {
  ReversiDO: DurableObjectNamespace;
}
