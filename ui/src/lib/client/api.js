/**
 * JSON over fetch, with the server's own error message when it fails.
 *
 * Every route answers `{ error }` on failure, sometimes with `hint` and
 * `running`; those are kept on the thrown error so a page can show them.
 * @param {string} url
 * @param {{ method?: string, body?: unknown }} [options]
 * @returns {Promise<any>}
 */
export async function api(url, { method = "GET", body } = {}) {
  /** @type {Record<string, string>} */
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  // This launch's token, which a run that edits the repository must carry.
  if (method !== "GET") headers["x-improve-token"] = launchToken();
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw Object.assign(new Error("The UI server is not answering. Is it still running?"), { offline: true });
  }
  const value = await response.json().catch(() => ({}));
  if (!response.ok || value?.ok === false) {
    const error = new Error(value?.error ?? `Request failed (${response.status})`);
    Object.assign(error, { status: response.status, hint: value?.hint, running: value?.running, detail: value });
    throw error;
  }
  return value;
}

function launchToken() {
  return document.querySelector('meta[name="improve-token"]')?.getAttribute("content") ?? "";
}
