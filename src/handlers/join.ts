// handlers/join.ts

import { broadcast } from "./sse";

function generateToken(): string {
  return Math.random().toString(36).slice(-8);
}

export async function join(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const seat = searchParams.get("seat"); // "black", "white", "observer"

  if (!id || !seat || !["black", "white", "observer"].includes(seat)) {
    return new Response("Missing or invalid id or seat", { status: 400 });
  }

  const token = generateToken();

  const payload = Object.fromEntries(searchParams.entries());
  broadcast(id, payload);

  return Response.json({
    ok: true,
    token,
    seat,
  });
}