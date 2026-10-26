import crypto from "node:crypto";

/**
 * A secret minted when this server starts, for requests that hand an agent
 * write access.
 *
 * The same-origin check in hooks.server.js already refuses other sites. Apply
 * is the one request that lets an agent edit the repository, so it must also
 * carry this token, which only a page this server rendered can read. A token
 * from an earlier launch is refused, so a stale tab cannot start a run.
 */
export const LAUNCH_TOKEN = crypto.randomBytes(24).toString("hex");

export const TOKEN_HEADER = "x-improve-token";

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
