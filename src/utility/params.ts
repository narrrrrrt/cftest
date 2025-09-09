// src/utility/params.ts
export async function readParams(req: Request): Promise<Record<string, string>> {
  if (req.method === 'POST') {
    const text = (await req.text()).trim();
    const sp = new URLSearchParams(text);
    return Object.fromEntries(sp.entries());
  }

  // GET/HEADなどはURLクエリから
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries());
}