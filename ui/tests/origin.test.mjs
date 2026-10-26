// The API is same-origin only, and refuses writes from any other origin.
import assert from "node:assert/strict";
import { handle } from "../src/hooks.server.js";

const ORIGIN = "http://127.0.0.1:5173";

async function send(method, pathname, headers = {}, base = ORIGIN) {
  const url = new URL(pathname, base);
  const request = new Request(url, { method, headers: { host: url.host, ...headers } });
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

// --- host allowlist: DNS rebinding -----------------------------------------
// A page on evil.example whose name now resolves to 127.0.0.1 is same-origin
// with itself, so only the Host header gives it away.
const REBOUND = "http://evil.example:5173";
for (const method of ["POST", "GET"]) {
  const rebound = await send(method, "/api/dreams", { origin: REBOUND }, REBOUND);
  assert.equal(rebound.response.status, 403, `a rebinding ${method}`);
  assert.equal(rebound.resolved, false);
  assert.match((await rebound.response.json()).error, /host/);
}

for (const base of ["http://localhost:5173", "http://127.0.0.1:4500", "http://[::1]:5173"]) {
  const local = await send("POST", "/api/dreams", { origin: base }, base);
  assert.equal(local.resolved, true, `${base} is accepted`);
}

const missingHost = await handle({
  event: { request: new Request(`${ORIGIN}/api/transcripts`), url: new URL(`${ORIGIN}/api/transcripts`) },
  resolve: async () => new Response("{}")
});
assert.equal(missingHost.status, 403, "a request with no Host is refused");

const page = await send("GET", "/proposals", {}, REBOUND);
assert.equal(page.resolved, true, "pages carry no data and are not checked");

process.env.IMPROVE_ALLOWED_HOSTS = "box.internal, other.internal";
assert.equal((await send("GET", "/api/status", {}, "http://box.internal:5173")).resolved, true);
assert.equal((await send("GET", "/api/status", {}, "http://other.internal")).resolved, true);
assert.equal((await send("GET", "/api/status", {}, REBOUND)).response.status, 403);
delete process.env.IMPROVE_ALLOWED_HOSTS;
assert.equal((await send("GET", "/api/status", {}, "http://box.internal:5173")).response.status, 403);

process.env.ORIGIN = "https://ui.example.dev";
const proxied = await send("POST", "/api/dreams", { origin: "https://ui.example.dev" }, "https://ui.example.dev");
assert.equal(proxied.resolved, true, "ORIGIN's host is accepted");
delete process.env.ORIGIN;

process.env.HOST = "10.0.0.5";
assert.equal((await send("GET", "/api/status", {}, "http://10.0.0.5:5173")).resolved, true, "a specific HOST is accepted");
process.env.HOST = "0.0.0.0";
assert.equal((await send("GET", "/api/status", {}, "http://0.0.0.0:5173")).response.status, 403, "a wildcard HOST adds nothing");
delete process.env.HOST;

console.log("origin tests passed");
