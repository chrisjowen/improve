import { untrack } from "svelte";
import { connection } from "./connection.svelte.js";

/**
 * improve's own `$lib/client/api.js` for its pages inside Wheelhouse (the
 * build swaps it in): the same JSON over fetch, with the server's own error
 * message when it fails, sent to improve's review UI on its own origin. Every
 * request carries the UI's token, since a page on another origin may drive it
 * only with that (ui/src/hooks.server.js).
 * @param {string} url
 * @param {{ method?: string, body?: unknown }} [options]
 * @returns {Promise<any>}
 */
export async function api(url, { method = "GET", body } = {}) {
  // Read, not watched: a page's effect that calls this should not rerun when Wheelhouse re-reads the token.
  const { base, token } = untrack(() => ({ base: connection.url, token: connection.token }));
  /** @type {Record<string, string>} */
  const headers = { "x-improve-token": token };
  if (body !== undefined) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(`${base}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      mode: "cors",
      credentials: "omit"
    });
  } catch {
    throw Object.assign(new Error("improve’s review UI is not answering. Is it still running?"), { offline: true });
  }
  const value = await response.json().catch(() => ({}));
  if (response.status === 403 && /token/.test(value?.error ?? "")) connection.refused = true;
  if (!response.ok || value?.ok === false) {
    const error = new Error(value?.error ?? `Request failed (${response.status})`);
    Object.assign(error, { status: response.status, hint: value?.hint, running: value?.running, detail: value });
    throw error;
  }
  return value;
}
