/**
 * The UI may be served through the ONA proxy while the browser talks to a
 * different origin, so the API answers cross-origin requests. There is no auth
 * by deliberate choice, so this is not loosening a boundary that exists.
 */
const ALLOW_ORIGIN = process.env.IMPROVE_CORS_ORIGIN || "*";

export async function handle({ event, resolve }) {
  if (event.request.method === "OPTIONS" && event.url.pathname.startsWith("/api/")) {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": ALLOW_ORIGIN,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400"
      }
    });
  }

  const response = await resolve(event);
  if (event.url.pathname.startsWith("/api/")) {
    response.headers.set("access-control-allow-origin", ALLOW_ORIGIN);
    response.headers.set("vary", "origin");
  }
  return response;
}
