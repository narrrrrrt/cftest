export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return await env.ASSETS.fetch(request);
  },
}