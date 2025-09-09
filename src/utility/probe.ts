// src/utility/probe.ts
export async function probe(tag: string, req: Request) {
  const u = new URL(req.url);
  const ct = req.headers.get('content-type');
  const body = await req.clone().text(); // cloneなので消費しない
  console.log(`[${tag}] method=${req.method} path=${u.pathname} ct=${ct} body="${body}"`);
}