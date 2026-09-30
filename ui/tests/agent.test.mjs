import assert from "node:assert/strict";
import { DENIED_TOOLS, extractJson, parseAgentOutput } from "../../scripts/spawn-agent.mjs";

// The background agent must never hold a write tool. Prose in the prompt is a
// request; these flags are the boundary.
for (const tool of ["Edit", "Write", "NotebookEdit"]) {
  assert.ok(DENIED_TOOLS.includes(tool), `${tool} must be denied`);
}

// The CLI wraps the reply in an envelope whose result is assistant text.
const fenced = parseAgentOutput(JSON.stringify({
  result: 'Here you go:\n```json\n{"name":"deploy-check","body":"# hi"}\n```\n',
  total_cost_usd: 0.02
}));
assert.equal(fenced.ok, true);
assert.equal(fenced.payload.name, "deploy-check");
assert.equal(fenced.envelope.cost_usd, 0.02);

const bare = parseAgentOutput(JSON.stringify({ result: '{"name":"a","body":"b"}' }));
assert.equal(bare.ok, true);
assert.equal(bare.payload.name, "a");

const prose = parseAgentOutput(JSON.stringify({ result: "I could not do that." }));
assert.equal(prose.ok, false);
assert.match(prose.error, /no JSON object/);

const notJson = parseAgentOutput("segmentation fault");
assert.equal(notJson.ok, false);
assert.match(notJson.error, /not JSON/);

// Surrounding prose must not defeat extraction.
assert.deepEqual(extractJson('prefix {"a":1} suffix'), { a: 1 });
assert.equal(extractJson("no object here"), undefined);
assert.equal(extractJson(undefined), undefined);

console.log("agent output tests passed");
