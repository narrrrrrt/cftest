// utils/params.ts
export class JsonBodyNotAllowedError extends Error {
  constructor(msg = 'JSON body is not allowed') {
    super(msg);
    this.name = 'JsonBodyNotAllowedError';
  }
}

/**
 * GET/HEAD: URLクエリを返す
 * POST: ボディが「クエリ文字列」または form の場合のみ受理（URLは無視）
 *  - JSONが来たら JsonBodyNotAllowedError を投げる（→ 呼び出し側で 500）
 *  - それ以外でクエリとして解釈不能なら通常の Error を投げる（→ 呼び出し側で 400 など）
 */
export async function readQueryParams(req: Request): Promise<Record<string, string>> {
  const urlParams = Object.fromEntries(new URL(req.url).searchParams.entries());

  if (req.method !== 'POST') {
    return urlParams; // GET/HEAD は従来通り URL クエリ
  }

  const r = req.clone();
  const ct = (r.headers.get('content-type') || '').toLowerCase();

  // JSON は明示的に拒否（500）
  if (ct.includes('application/json')) {
    throw new JsonBodyNotAllowedError();
  }

  // form系（URLエンコード or multipart）はそのまま受理
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await r.formData();
    return Object.fromEntries(form.entries()) as Record<string, string>;
  }

  // それ以外は text として読み、"a=1&b=2" 形式だけ受理
  const text = await r.text();
  const trimmed = text.trim();

  if (!trimmed) {
    // 空ボディ → パラメータなし（POST は URL を使わない仕様）
    return {};
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Content-Type が無くても中身が JSON っぽければ 500
    throw new JsonBodyNotAllowedError();
  }

  // "a=1&b=2" だけ受理（厳しめ）
  if (!trimmed.includes('=')) {
    throw new Error('Body is not querystring format');
  }

  const sp = new URLSearchParams(trimmed);
  return Object.fromEntries(sp.entries()) as Record<string, string>;
}