/**
 * The API is same-origin only and has no authentication, so a state-changing
 * request must come from a page this server served. Without this, any web page
 * open in the person's browser could start evaluations and paid agent runs, or
 * approve, reject and apply proposals.
 */
const SAFE_METHODS = new Set(["GET", "HEAD"]);

function requestOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

export async function handle({ event, resolve }) {
  if (
    event.url.pathname.startsWith("/api/") &&
    !SAFE_METHODS.has(event.request.method) &&
    requestOrigin(event.request) !== event.url.origin
  ) {
    return new Response(JSON.stringify({ error: "Cross-origin requests may not change anything." }), {
      status: 403,
      headers: { "content-type": "application/json" }
    });
  }
  return resolve(event);
}
