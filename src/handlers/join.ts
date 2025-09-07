import { createRoom } from "../schema/types";
import { pushToRoom } from "./sse";

export async function join(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());

  const roomId = params.id;
  const room = createRoom(roomId);

  const payload = {
    roomId,
    query: params,
    status: room.status,
  };

  // SSE接続中のクライアントに通知を送る
  pushToRoom(roomId, payload);

  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
  });
}