import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// A synthetic Firstmate home with the adapter on, before the data modules load.
const home = fs.mkdtempSync(path.join(os.tmpdir(), "improve-fm-scope-"));
process.env.IMPROVE_PROJECT_DIR = home;
delete process.env.FM_HOME;
fs.writeFileSync(path.join(home, "AGENTS.md"), "# Firstmate\n\nThe supervisor contract for a test home.\n");
fs.mkdirSync(path.join(home, "data"));
const proposalsDir = path.join(home, ".harness", "proposals");
fs.mkdirSync(proposalsDir, { recursive: true });
const improveJson = path.join(home, ".harness", "improve.json");
const adapter = (enabled) => fs.writeFileSync(improveJson, JSON.stringify({ adapters: { firstmate: { enabled } } }));

const proposal = (id, files) => [
  `id: ${id}`,
  `title: ${id}`,
  "status: proposed",
  "scope:",
  "  files:",
  ...files.map((file) => `    - ${file}`),
  ""
].join("\n");

fs.writeFileSync(path.join(proposalsDir, "prefs.yaml"), proposal("prefs", ["data/captain.md", "config/brief-include.md"]));
fs.writeFileSync(path.join(proposalsDir, "script.yaml"), proposal("script", ["bin/fm-spawn.sh"]));
fs.writeFileSync(path.join(proposalsDir, "both.yaml"), proposal("both", ["data/learnings.md", "AGENTS.md"]));

const { listProposals } = await import("../src/lib/server/proposals.js");
const { scopeLabel, showScope } = await import("../src/lib/client/format.js");
const byId = () => Object.fromEntries(listProposals().map((p) => [p.id, p]));

// With the adapter on, the captain's own files are captain-private harness
// material: never "application code", and the label says whose files they are.
adapter(true);
let proposals = byId();
assert.equal(proposals.prefs.check.scope, "harness");
assert.deepEqual(proposals.prefs.check.outside, []);
assert.equal(proposals.prefs.check.firstmate.visibility, "captain-private");
assert.equal(proposals.prefs.check.firstmate.delivery, "local-apply");
assert.equal(proposals.prefs.check.firstmate.files["data/captain.md"], "captain-private");
assert.equal(scopeLabel(proposals.prefs.check).label, "Captain-private");
assert.doesNotMatch(scopeLabel(proposals.prefs.check).label, /application/i);
assert.equal(showScope(proposals.prefs.check), true, "list rows say whose files change");

assert.equal(scopeLabel(proposals.script.check).label, "Shared Firstmate files");
assert.equal(proposals.both.check.firstmate.visibility, "mixed");
assert.equal(scopeLabel(proposals.both.check).label, "Captain-private and shared");

// With the adapter off, the home is an ordinary repository, as before.
adapter(false);
proposals = byId();
assert.equal(proposals.prefs.check.scope, "codebase");
assert.equal(proposals.prefs.check.firstmate, undefined);
assert.equal(scopeLabel(proposals.prefs.check).label, "Changes application code");
assert.equal(showScope({ scope: "harness", outside: [] }), false, "plain harness rows stay quiet");

console.log("firstmate scope labels ok");
