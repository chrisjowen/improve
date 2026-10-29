import { LAUNCH_TOKEN, TOKEN_HEADER, hasLaunchToken } from "./lib/server/launch.js";

/**
 * The API is same-origin only and has no authentication, so a state-changing
 * request must come from a page this server served. Without this, any web page
 * open in the person's browser could start evaluations and paid agent runs, or
 * approve, reject and apply proposals.
 *
 * The origin check alone trusts the Host header, which a DNS-rebinding page
 * controls, so every request must also name a host this server answers to.
 * Both checks apply to every request, whatever its path: routing decodes the
 * path, so a prefix test on the encoded one is no boundary.
 *
 * One kind of page on another origin may drive the server: improve's panels
 * in Wheelhouse, whose server reads this launch's token server to server
 * (/api/embed) and hands it to them. A request from another origin that
 * carries the token is let through, with CORS headers, when that origin is
 * on this computer (a loopback name, any port) or named in
 * IMPROVE_ALLOWED_ORIGINS. The token is what a page on any other site cannot
 * get, so the origin check is a second fence, not the first.
 */
const SAFE_METHODS = new Set(["GET", "HEAD"]);
/** @type {(string | undefined)[]} */
const LOOPBACK = ["127.0.0.1", "localhost", "[::1]"];

/**
 * @param {string} value
 * @returns {string | undefined}
 */
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
  /** @type {Set<string | undefined>} */
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

/** @param {Request} request */
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

/** @param {string} error */
function refuse(error) {
  return new Response(JSON.stringify({ error }), { status: 403, headers: { "content-type": "application/json" } });
}

/**
 * Whether a page at `origin` may drive this server when it carries the token.
 * @param {string} origin
 */
export function embedderOrigin(origin, env = process.env) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (LOOPBACK.includes(url.hostname)) return true;
  return (env.IMPROVE_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((extra) => extra.trim().replace(/\/+$/, "").toLowerCase())
    .includes(url.origin);
}

/**
 * The response, readable by a page at `origin`.
 * @param {Response} response
 * @param {string} origin
 */
function withCors(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.append("vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * The answer to a CORS preflight from a page that may drive this server. It
 * changes nothing: the request it clears must still carry the token.
 * @param {Request} request
 * @param {string} origin
 */
function preflight(request, origin) {
  const headers = new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST",
    "access-control-allow-headers": `content-type, ${TOKEN_HEADER}`,
    "access-control-max-age": "600",
    vary: "Origin"
  });
  if (request.headers.get("access-control-request-private-network") === "true") {
    headers.set("access-control-allow-private-network", "true");
  }
  return new Response(null, { status: 204, headers });
}

export async function handle({ event, resolve }) {
  const host = event.request.headers.get("host") ?? "";
  if (!allowedHosts().has(hostname(host))) {
    return refuse("This server does not answer to that host name. See ui/README.md, No authentication.");
  }
  // ORIGIN pins event.url to one loopback name, but the same server is just as
  // much itself at the others, so a loopback page's own origin is its Host.
  const self = LOOPBACK.includes(hostname(host)) ? `http://${host.trim().toLowerCase()}` : event.url.origin;
  // The page carries this launch's token; see lib/server/launch.js.
  const options = {
    /** @param {{ html: string }} chunk */
    transformPageChunk: ({ html }) => html.replace("%improve.token%", LAUNCH_TOKEN)
  };
  const origin = event.request.headers.get("origin");
  if (origin && origin !== self && embedderOrigin(origin)) {
    if (event.request.method === "OPTIONS") return preflight(event.request, origin);
    if (hasLaunchToken(event.request)) return withCors(await resolve(event, options), origin);
    if (!SAFE_METHODS.has(event.request.method)) {
      return withCors(refuse("This request does not carry this improve UI's token. Reload the page that sent it."), origin);
    }
  }
  if (!SAFE_METHODS.has(event.request.method) && requestOrigin(event.request) !== self) {
    return refuse("Cross-origin requests may not change anything.");
  }
  return resolve(event, options);
}
