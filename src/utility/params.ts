// utilty/params.ts
export async function readParams(req: Request): Promise<Record<string, any>> {
  const urlParams = Object.fromEntries(new URL(req.url).searchParams.entries());

  if (req.method !== 'POST') return urlParams;

  const ct = req.headers.get('content-type') || '';

  try {
    if (ct.includes('application/json')) {
      const json = await req.json();
      return { ...urlParams, ...json };
    }

    if (
      ct.includes('application/x-www-form-urlencoded') ||
      ct.includes('multipart/form-data')
    ) {
      const form = await req.formData();
      return { ...urlParams, ...Object.fromEntries(form.entries()) };
    }

    const text = await req.text();
    if (text && text.includes('=')) {
      const sp = new URLSearchParams(text);
      return { ...urlParams, ...Object.fromEntries(sp.entries()) };
    }

    return urlParams;
  } catch {
    return urlParams;
  }
}