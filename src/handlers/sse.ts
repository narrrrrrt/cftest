// 全ルーム一括ブロードキャスト専用実装（正常系のみ）
// ルームID単位で接続を保持するが、送信は常に「全接続」へ。

type Ctrl = ReadableStreamDefaultController;
const roomControllers = new Map<string, Set<Ctrl>>();
const encoder = new TextEncoder();

function bucketFor(id: string): Set<Ctrl> {
  let set = roomControllers.get(id);
  if (!set) {
    set = new Set<Ctrl>();
    roomControllers.set(id, set);
  }
  return set;
}

// ---- 外部からSSEにデータを送るAPI ----
// パラメータ無し。接続中の**全て**へ送る。
export function pushAll(data: any) {
  const bytes = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const set of roomControllers.values()) {
    for (const ctrl of set) {
      ctrl.enqueue(bytes);
    }
  }
}

// ---- SSEエンドポイント ----
// 呼び出し形は元ファイルと同様：new ReadableStream({ start(ctrl) { ... } })
export async function sse(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const roomId = (params["id"] || params["room"] || "lobby") as string;

  const stream = new ReadableStream({
    start(ctrl) {
      // 接続登録（ルーム毎に保持するが、送信は pushAll で全体へ）
      bucketFor(roomId).add(ctrl);

      // 初期通知も pushAll を使う（＝自分自身＋全接続へ）
      pushAll({
        type: "init",
        query: params,
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}