export async function join(request: Request): Promise<Response> {
  const url = new URL(request.url, "http://do");
  const params = Object.fromEntries(url.searchParams.entries());
  const body = JSON.stringify(params);
  return new Response(body, {
    headers: {
      "content-type": "application/json"
    }
  });
}
