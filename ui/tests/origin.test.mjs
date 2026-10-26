// The server answers only known hosts, and refuses writes from any other origin.
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

// The launcher pins ORIGIN to one loopback URL, so event.url keeps that host
// even when the page was opened at another loopback name for the same server.
for (const [opened, pinned] of [
  ["http://localhost:5173", "http://127.0.0.1:5173"],
  ["http://127.0.0.1:5173", "http://localhost:5173"]
]) {
  const url = new URL("/api/proposals/p.yaml/approve", pinned);
  const request = new Request(url, { method: "POST", headers: { host: new URL(opened).host, origin: opened } });
  let resolved = false;
  await handle({ event: { request, url }, resolve: async () => ((resolved = true), new Response("{}")) });
  assert.equal(resolved, true, `a page opened at ${opened} may write when ORIGIN is ${pinned}`);
  const other = new Request(url, { method: "POST", headers: { host: new URL(opened).host, origin: "http://localhost:9999" } });
  const refused = await handle({ event: { request: other, url }, resolve: async () => new Response("{}") });
  assert.equal(refused.status, 403, "another loopback port is still another origin");
}

const missingHost = await handle({
  event: { request: new Request(`${ORIGIN}/api/transcripts`), url: new URL(`${ORIGIN}/api/transcripts`) },
  resolve: async () => new Response("{}")
});
assert.equal(missingHost.status, 403, "a request with no Host is refused");

// Routing decodes the path, so an encoded /api/ prefix reaches the same routes.
for (const pathname of ["/proposals", "/", "/%61pi/transcripts", "/%61pi/dreams"]) {
  const rebound = await send("GET", pathname, {}, REBOUND);
  assert.equal(rebound.response.status, 403, `a rebinding GET of ${pathname}`);
  assert.equal(rebound.resolved, false);
}
for (const pathname of ["/%61pi/dreams", "/%61pi/proposals/p.yaml/reject", "/proposals"]) {
  const foreign = await send("POST", pathname, { origin: "http://evil.example" });
  assert.equal(foreign.response.status, 403, `a cross-origin POST to ${pathname}`);
  assert.equal(foreign.resolved, false);
}
for (const base of ["http://localhost:5173", "http://127.0.0.1:5173", "http://[::1]:5173"]) {
  assert.equal((await send("GET", "/proposals", {}, base)).resolved, true, `a page load at ${base}`);
}

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
