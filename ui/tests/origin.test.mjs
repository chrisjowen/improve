// The API is same-origin only, and refuses writes from any other origin.
import assert from "node:assert/strict";
import { handle } from "../src/hooks.server.js";

const ORIGIN = "http://127.0.0.1:5173";

async function send(method, pathname, headers = {}) {
  const url = new URL(pathname, ORIGIN);
  const request = new Request(url, { method, headers });
  let resolved = false;
  const response = await handle({
    event: { request, url },
    resolve: async () => {
      resolved = true;
      return new Response("{}", { headers: { "content-type": "application/json" } });
    }
  });
  return { response, resolved };
}

for (const [label, headers] of [
  ["a cross-origin POST", { origin: "http://evil.example" }],
  ["a POST with no Origin or Referer", {}],
  ["a POST whose Referer is another site", { referer: "http://evil.example/page" }],
  ["a POST whose Origin is another port", { origin: "http://127.0.0.1:9999" }]
]) {
  const { response, resolved } = await send("POST", "/api/dreams", headers);
  assert.equal(response.status, 403, label);
  assert.equal(resolved, false, `${label} never reaches the route`);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
}

const sameOrigin = await send("POST", "/api/proposals/p.yaml/reject", { origin: ORIGIN });
assert.equal(sameOrigin.resolved, true, "a same-origin POST is allowed");
assert.equal(sameOrigin.response.headers.get("access-control-allow-origin"), null);

const byReferer = await send("POST", "/api/jobs/x/cancel", { referer: `${ORIGIN}/runs` });
assert.equal(byReferer.resolved, true, "a same-origin Referer stands in for a missing Origin");

for (const method of ["DELETE", "PUT", "PATCH"]) {
  assert.equal((await send(method, "/api/jobs/x", { origin: "http://evil.example" })).response.status, 403, method);
}

const read = await send("GET", "/api/transcripts");
assert.equal(read.resolved, true, "a plain GET is allowed");
assert.equal(read.response.headers.get("access-control-allow-origin"), null);

const preflight = await send("OPTIONS", "/api/dreams", { origin: "http://evil.example" });
assert.equal(preflight.response.status, 403, "no CORS preflight is answered");

console.log("origin tests passed");
