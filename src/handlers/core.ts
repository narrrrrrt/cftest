// src/handlers/core.ts（差し替えポイントのみ）
export async function handleAction(request: Request, ctx: HandlerCtx): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const name = url.pathname.slice(1); // "join" | "move" | ...

  try {
    // 動的に handlers/<name>.ts を読み込む（ファイル名＝エンドポイント名の約束）
    const mod = await import(`./${name}.ts`);
    const fn = (mod[`${name}Action`] ?? mod.default) as ActionHandler;
    if (typeof fn !== "function") throw new Error("handler not found");

    const params = Object.fromEntries(url.searchParams.entries());
    const result = await fn(params, ctx);

    if (result?.broadcast !== undefined) {
      pushAll(result.broadcast);
    }
    const status = result?.response?.status ?? 200;
    const body   = result?.response?.body   ?? { ok: true };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return json({ error: "unsupported endpoint" }, 500);
  }
}
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}