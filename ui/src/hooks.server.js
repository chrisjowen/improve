/**
 * The API is same-origin only and has no authentication, so a state-changing
 * request must come from a page this server served. Without this, any web page
 * open in the person's browser could start evaluations and paid agent runs, or
 * approve, reject and apply proposals.
 *
 * The origin check alone trusts the Host header, which a DNS-rebinding page
 * controls, so every API request must also name a host this server answers to.
 */
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const LOOPBACK = ["127.0.0.1", "localhost", "[::1]"];

function hostname(value) {
  const host = value.trim().toLowerCase();
  if (!host) return undefined;
  const bareIPv6 = host.split(":").length > 2 && !host.startsWith("[");
  try {
    return new URL(`http://${bareIPv6 ? `[${host}]` : host}`).hostname;
  } catch {
    return undefined;
  }
}

function allowedHosts(env = process.env) {
  const allowed = new Set(LOOPBACK);
  if (env.HOST && env.HOST !== "0.0.0.0" && env.HOST !== "::") allowed.add(hostname(env.HOST));
  if (env.ORIGIN) {
    try {
      allowed.add(new URL(env.ORIGIN).hostname);
    } catch {
      // adapter-node refuses a malformed ORIGIN itself
    }
  }
  for (const extra of (env.IMPROVE_ALLOWED_HOSTS ?? "").split(",")) allowed.add(hostname(extra));
  allowed.delete(undefined);
  return allowed;
}

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

function refuse(error) {
  return new Response(JSON.stringify({ error }), { status: 403, headers: { "content-type": "application/json" } });
}

export async function handle({ event, resolve }) {
  if (!event.url.pathname.startsWith("/api/")) return resolve(event);
  const host = event.request.headers.get("host") ?? "";
  if (!allowedHosts().has(hostname(host))) {
    return refuse("This server does not answer to that host name. See ui/README.md, No authentication.");
  }
  // ORIGIN pins event.url to one loopback name, but the same server is just as
  // much itself at the others, so a loopback page's own origin is its Host.
  const self = LOOPBACK.includes(hostname(host)) ? `http://${host.trim().toLowerCase()}` : event.url.origin;
  if (!SAFE_METHODS.has(event.request.method) && requestOrigin(event.request) !== self) {
    return refuse("Cross-origin requests may not change anything.");
  }
  return resolve(event);
}
