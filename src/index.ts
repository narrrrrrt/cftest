export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return await env.ASSETS.fetch(request);
  },
}
// 使っていないけど export だけは維持
export { ReversiDO } from "./ReversiDO";