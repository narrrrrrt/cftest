export class ReversiDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const info = await this.debugEcho(request);
    return new Response(JSON.stringify(info), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  private async debugEcho(request: Request) {
    const url = new URL(request.url, "http://do");
    const before = request.bodyUsed;

    const { id, params } = await this.getParams(request);

    // ここでは body をこれ以上触らない（1回も読んでいない or JSONで一度だけ）
    const after = request.bodyUsed;

    return {
      ok: true,
      method: request.method,
      path: url.pathname,
      search: url.search,
      bodyUsedBefore: before,
      bodyUsedAfter: after,
      id,
      params,
      headers: Object.fromEntries(request.headers.entries())
    };
  }

  private async getParams(request: Request): Promise<{ id: string | null; params: Record<string, any> }> {
    const m = request.method.toUpperCase();

    if (m === "GET") {
      const url = new URL(request.url, "http://do");
      const params = Object.fromEntries(url.searchParams.entries());
      const id = params.id != null ? String(params.id) : null;
      return { id, params };
    }

    if (m === "POST") {
      // POST は JSON のみを読む（フォールバック無し）
      let parsed: any = {};
      try {
        parsed = await request.json();
      } catch {
        parsed = {};
      }
      const id = parsed?.id != null ? String(parsed.id) : null;
      return { id, params: (parsed && typeof parsed === "object") ? parsed : {} };
    }

    return { id: null, params: {} };
  }
}