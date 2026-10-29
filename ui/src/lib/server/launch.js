import crypto from "node:crypto";
import { projectRoot } from "./paths.js";

/**
 * A secret for this launch, for requests that hand an agent write access and
 * for pages on another origin that may drive this server.
 *
 * The same-origin check in hooks.server.js already refuses other sites. Apply
 * is the one request that lets an agent edit the repository, so it must also
 * carry this token, which only a page this server rendered can read. A token
 * from an earlier launch is refused, so a stale tab cannot start a run. This
 * is intended defence in depth for the one route that grants edit tools.
 *
 * It is minted when the server starts, unless whatever starts the server
 * hands it one in IMPROVE_LAUNCH_TOKEN: Wheelhouse does, so its improve panels
 * can drive the server they launched before Wheelhouse next reads the token
 * back from /api/embed (see hooks.server.js).
 */
export const LAUNCH_TOKEN = given(process.env.IMPROVE_LAUNCH_TOKEN) ?? crypto.randomBytes(24).toString("hex");

export const TOKEN_HEADER = "x-improve-token";

/**
 * A handed-in token, when it is long and random enough to stand in for a minted one.
 * @param {string | undefined} value
 */
function given(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(value) ? value : undefined;
}

/**
 * True when the request carries this launch's token.
 * @param {Request} request
 */
export function hasLaunchToken(request) {
  const given = request.headers.get(TOKEN_HEADER) ?? "";
  const expected = Buffer.from(LAUNCH_TOKEN);
  const actual = Buffer.from(given);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/**
 * This launch's token and the repository it serves, for a program on this
 * computer to read server to server: Wheelhouse's improve plugin reads it so
 * its panels can drive this server from Wheelhouse's page (see
 * hooks.server.js). Every page this server renders carries the same token,
 * so this tells a program no more than a page load does. A browser's request
 * is refused, so no page, on any origin, reads it here.
 * @param {Request} request
 */
export function embed(request) {
  const site = request.headers.get("sec-fetch-site");
  if (request.headers.has("origin") || (site !== null && site !== "none")) {
    return Response.json({ error: "Only a program on this computer reads the token here, not a page." }, { status: 403 });
  }
  return Response.json({ token: LAUNCH_TOKEN, project: projectRoot() });
}
