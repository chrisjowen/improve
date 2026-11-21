// The acceptance gate: WITH, WITHOUT and delta from an ablation run, and the
// rule a proposal passes on the validation split.
import assert from "node:assert/strict";
import { caseScores, compare, gate, losing, signed } from "../scripts/replay-gate.mjs";

const run = (score, error = null) => ({ score, error });
const result = (cases) => ({
  cases: Object.entries(cases).map(([name, [w, wo]]) => ({ name, arms: { with: w.map((s) => (s === null ? run(0, "timed out") : run(s))), without: wo.map((s) => run(s)) } }))
});

// --- per case ---------------------------------------------------------------
const [c] = caseScores(result({ a: [[1, 1, 0], [0, 0, 0]] }));
assert.equal(c.with.mean.toFixed(4), "0.6667");
assert.equal(c.without.mean, 0);
assert.equal(c.delta, 0.6667);
// sd of [1,1,0] is 0.5774; se = sqrt(0.3333/3 + 0) = 0.3333
assert.equal(c.se, 0.3333);

const [errored] = caseScores(result({ e: [[null, 1, 1], [1, 1, 1]] }));
assert.equal(errored.with.errors, 1, "an errored run is counted");
assert.equal(errored.with.mean.toFixed(4), "0.6667", "and scores 0, never dropped");

// --- over cases -------------------------------------------------------------
const two = caseScores(result({ a: [[1, 1, 1], [0, 0, 0]], b: [[1, 1, 1], [1, 1, 1]] }));
assert.deepEqual(compare(two), { with: 1, without: 0.5, delta: 0.5, se: 0, cases: 2, missing: 0 });
assert.equal(compare([]).delta, null);

// --- the gate ----------------------------------------------------------------
// Clear, consistent improvement passes.
assert.equal(gate(two).verdict, "pass");

// The real case from the feasibility run: WITH 0/0/0, WITHOUT 1/1/0.
const real = gate(caseScores(result({ "ui-prototypes-on-claude": [[0, 0, 0], [1, 1, 0]] })));
assert.equal(real.verdict, "fail");
assert.deepEqual(real.regressions, ["ui-prototypes-on-claude"]);

// A noisy gain inside the noise fails: delta 0.33, se 0.33, k = 2.
const noisy = gate(caseScores(result({ n: [[1, 0, 1], [0, 1, 0]] })));
assert.equal(noisy.verdict, "fail");
assert.match(noisy.reasons[0], /not above 2 standard errors/);
// With k = 0.5 the same delta passes.
assert.equal(gate(caseScores(result({ n: [[1, 1, 1], [0, 1, 0]] })), { k: 0.5 }).verdict, "pass");

// A higher average does not hide a case that got worse.
const hidden = gate(caseScores(result({ up: [[1, 1, 1], [0, 0, 0]], up2: [[1, 1, 1], [0, 0, 0]], down: [[0, 0, 0], [1, 1, 1]] })));
assert.ok(hidden.delta > 0);
assert.equal(hidden.verdict, "fail");
assert.deepEqual(hidden.regressions, ["down"]);
// Unless the tolerance allows that much.
assert.equal(gate(caseScores(result({ up: [[1, 1, 1], [0, 0, 0]], dip: [[1, 1, 0], [1, 1, 1]] })), { tolerance: 0.34, k: 1 }).verdict, "pass");

// No change is not an improvement.
assert.equal(gate(caseScores(result({ flat: [[1, 1, 1], [1, 1, 1]] }))).verdict, "fail");

// Incomplete runs never pass.
assert.equal(gate(two, { partial: true }).verdict, "incomplete");
assert.equal(gate([]).verdict, "incomplete");
assert.equal(gate(caseScores({ cases: [{ name: "x", arms: { with: [run(1)] } }] })).verdict, "incomplete", "a case with one arm");

// --- losing ------------------------------------------------------------------
assert.equal(losing(gate(caseScores(result({ a: [[0, 0, 0], [1, 1, 1]] })))), true);
assert.equal(losing(gate(caseScores(result({ a: [[1, 1, 1], [1, 1, 1]] })))), false, "no longer helping is not losing");
assert.equal(losing(gate(two, { partial: true })), false, "an incomplete run says nothing");

assert.equal(signed(0.5), "+0.50");
assert.equal(signed(-0.25), "-0.25");
assert.equal(signed(null), "n/a");
console.log("replay gate ok");
