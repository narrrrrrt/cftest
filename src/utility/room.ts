// src/utility/room.ts
export async function extractRoomId(req: Request): Promise<string | null> {
  if (req.method === "POST") {
    // POST は body の querystring を読む
    const text = (await req.clone().text()).trim();
    if (!text) return null;
    const sp = new URLSearchParams(text);
    return sp.get("id");
  }

  // GET/HEAD は URL の querystring
  const u = new URL(req.url, "http://do");
  return u.searchParams.get("id");
}