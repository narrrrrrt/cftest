// src/utility/probe.ts
export async function probe(req: Request) {
  const url = new URL(req.url);
  const ct = req.headers.get("content-type") || "";
  const method = req.method;

  let bodySnippet = "";
  try {
    const body = await req.clone().text();
    bodySnippet = body.length > 200 ? body.slice(0, 200) + "...(truncated)" : body;
  } catch (e) {
    bodySnippet = `[body read error: ${String(e)}]`;
  }

  // 常に "PROBE" から始まる固定書式でログ出力
  console.log(
    "PROBE method=", method,
    "path=", url.pathname,
    "ct=", ct,
    "body=", bodySnippet
  );
}