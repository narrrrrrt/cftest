// src/utility/params.ts

export async function readParams(req: Request): Promise<Record<string, string>> {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams.entries());
}