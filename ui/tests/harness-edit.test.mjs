import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

// Editing objectives and evals from the review UI. An objective's own fields
// are written straight after a confirmed diff; an eval edit and every deletion
// is filed as a proposal holding the exact bytes, written only by Approve and
// write, and never with a command the eval does not declare.

const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-edit-")));
process.env.IMPROVE_PROJECT_DIR = repo;
const harness = path.join(repo, ".harness");
const suites = path.join(harness, "evals", "suites");
fs.mkdirSync(suites, { recursive: true });
fs.mkdirSync(path.join(harness, "proposals"), { recursive: true });
fs.copyFileSync(path.resolve(import.meta.dirname, "../../assets/eval-rig/registry.yaml"), path.join(harness, "evals", "registry.yaml"));

const objectivesFile = path.join(harness, "objectives.yaml");
fs.writeFileSync(objectivesFile, `# Objectives the harness is measured against.
version: 1
objectives:
  - id: tests-stay-green
    description: The test suite passes after an agent's change.
    owner: null
    regime: replayable # a fixed task
    success_criteria:
      - npm test exits 0.
    baseline:
      suite_score: null
    target:
      suite_score: 1.0
    review_by: null
`);
const suiteFile = path.join(suites, "unit-tests.yaml");
fs.writeFileSync(suiteFile, `version: 1
id: unit-tests
objective: tests-stay-green
registries: [../registry.yaml]
commands:
  - [npm, test]
steps:
  - id: unit-tests-pass
    evaluator: core.command
    threshold: 1
    required: true
    metadata:
      argv: [npm, test]
challenge:
  must_fail:
    - id: kept
      description: Survives an edit.
      context: {}
aggregation:
  threshold: 1
`);

const edit = await import("../src/lib/server/harness-edit.js");
const { listProposals, readProposal } = await import("../src/lib/server/proposals.js");
const read = (file) => fs.readFileSync(file, "utf8");

// --- an objective's own fields: preview, then write the reviewed change --------
{
  const fields = { description: "The repository's tests pass after an agent's change.", success_criteria: ["npm test exits 0.", "No test is skipped."], target: 0.9 };
  const before = read(objectivesFile);
  const shown = edit.saveObjective({ id: "tests-stay-green", fields });
  assert.equal(shown.ok, true, shown.error);
  assert.equal(read(objectivesFile), before, "a preview writes nothing");
  assert.equal(shown.files[0].path, ".harness/objectives.yaml");
  assert.match(shown.files[0].proposed, /No test is skipped/);
  assert.match(shown.files[0].proposed, /# Objectives the harness is measured against/, "comments survive");
  assert.match(shown.files[0].proposed, /regime: replayable # a fixed task/);
  assert.match(shown.files[0].proposed, /suite_score: 0\.9/);
  assert.match(shown.files[0].proposed, /baseline:\n\s+suite_score: null/, "fields the editor does not show are kept");

  assert.equal(edit.saveObjective({ id: "tests-stay-green", fields, digest: "0".repeat(64) }).status, 409, "a digest that is not the reviewed change is refused");
  const written = edit.saveObjective({ id: "tests-stay-green", fields, digest: shown.digest });
  assert.equal(written.ok, true, written.error);
  assert.equal(read(objectivesFile), shown.files[0].proposed);
  assert.equal(edit.saveObjective({ id: "tests-stay-green", fields }).error, "Nothing changed.");
}

// --- a stale tab is refused ------------------------------------------------------
{
  const fields = { owner: "captain" };
  const shown = edit.saveObjective({ id: "tests-stay-green", fields });
  fs.appendFileSync(objectivesFile, "# edited by hand\n");
  const refused = edit.saveObjective({ id: "tests-stay-green", fields, digest: shown.digest });
  assert.equal(refused.status, 409);
  assert.doesNotMatch(read(objectivesFile), /owner: captain/);
}

// --- only fields that decide nothing that runs ---------------------------------
{
  for (const fields of [{ id: "renamed" }, { suites: ["x"] }, { commands: [["rm", "-rf", "/"]] }]) {
    const refused = edit.saveObjective({ id: "tests-stay-green", fields });
    assert.equal(refused.status, 400, JSON.stringify(fields));
    assert.match(refused.error, /can be edited here/);
  }
  assert.match(edit.saveObjective({ id: "tests-stay-green", fields: { target: 2 } }).error, /between 0 and 1/);
  assert.match(edit.saveObjective({ id: "nope", fields: { owner: "x" } }).error, /No objective named nope/);
}

// --- a new objective ----------------------------------------------------------------
{
  assert.match(edit.saveObjective({ id: "Bad Id", create: true, fields: { description: "x" } }).error, /lowercase/);
  assert.match(edit.saveObjective({ id: "tests-stay-green", create: true, fields: { description: "x" } }).error, /already exists/);
  assert.match(edit.saveObjective({ id: "brief-followed", create: true, fields: {} }).error, /Say what the objective means/);
  const shown = edit.saveObjective({ id: "brief-followed", create: true, fields: { description: "A worker does what its brief asks.", success_criteria: ["Status lines use the brief's states."], regime: "observed" } });
  assert.equal(shown.ok, true, shown.error);
  assert.equal(edit.saveObjective({ id: "brief-followed", create: true, fields: { description: "A worker does what its brief asks.", success_criteria: ["Status lines use the brief's states."], regime: "observed" }, digest: shown.digest }).ok, true);
  const ids = YAML.parse(read(objectivesFile)).objectives.map((o) => o.id);
  assert.deepEqual(ids, ["tests-stay-green", "brief-followed"]);
}

// --- an eval edit is a proposal, and what it adds to what runs is named -----------
const suiteEdit = (changes = {}) => {
  const { suite } = edit.readSuite("unit-tests.yaml");
  return { ...suite, ...changes };
};
let filed;
{
  const loaded = edit.readSuite("unit-tests.yaml");
  assert.equal(loaded.ok, true, loaded.error);
  assert.deepEqual(loaded.suite.commands, [["npm", "test"]]);
  assert.deepEqual(loaded.runs.problems, []);
  // The editor picks a step's command from the declared ones; its other settings are YAML text.
  assert.deepEqual(loaded.suite.steps[0].command, ["npm", "test"]);
  assert.equal(loaded.suite.steps[0].settings, "");
  assert.ok(loaded.evaluators.some((e) => e.name === "core.command" && e.command_field === "argv"));

  const suite = suiteEdit();
  suite.commands = [["npm", "test"], ["npm", "run", "lint"]];
  suite.steps = [...suite.steps, { id: "lint", evaluator: "core.command", threshold: 1, required: true, metadata: { argv: ["npm", "run", "lint"] } }];
  const before = read(suiteFile);
  const shown = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite });
  assert.equal(shown.ok, true, shown.error);
  assert.deepEqual(shown.runs, { before: [["npm", "test"]], after: [["npm", "test"], ["npm", "run", "lint"]] });
  assert.match(shown.files[0].proposed, /- \[npm, run, lint\]/);
  // Only the edit is rewritten: the existing command and step keep their lines.
  const removed = shown.files[0].current.split("\n").filter((line) => !shown.files[0].proposed.split("\n").includes(line));
  assert.deepEqual(removed, [], "no existing line changes when a command and a step are added");
  assert.match(shown.files[0].proposed, /id: kept/, "parts the editor does not show are kept");

  filed = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite, digest: shown.digest, reason: "Lint failures reach review." });
  assert.equal(filed.ok, true, filed.error);
  assert.equal(read(suiteFile), before, "filing writes only the proposal");
  const proposal = readProposal(filed.proposal);
  assert.equal(proposal.status, "proposed");
  assert.equal(proposal.check.scope, "harness");
  assert.deepEqual(proposal.scope.files, [".harness/evals/suites/unit-tests.yaml"]);
  assert.equal(proposal.scope.permissions_changed, true, "adding a command widens what runs");
  assert.equal(proposal.hypothesis, "Lint failures reach review.");
  assert.match(proposal.intervention.summary, /npm run lint/);
  assert.deepEqual(proposal.harness_edit, { kind: "edit-eval", target: "unit-tests" });
  assert.deepEqual(proposal.check.prose, [], "the filed proposal passes improve's writing check");
}

// --- a step may only run a declared command ------------------------------------------
{
  const suite = suiteEdit();
  suite.steps = [{ id: "sneaky", evaluator: "core.command", metadata: { argv: ["curl", "example.com"] } }];
  const refused = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite });
  assert.equal(refused.status, 400);
  assert.match(refused.error, /Declare every command.*curl example\.com/);

  const judge = suiteEdit();
  judge.steps = [{ id: "judge", evaluator: "llm.judge-command", metadata: { adapter_argv: ["python3", "judge.py"], rubric: "r" } }];
  assert.match(edit.fileSuiteEdit({ file: "unit-tests.yaml", suite: judge }).error, /judge runs python3 judge\.py/);

  const badSettings = suiteEdit();
  badSettings.steps = [{ id: "grep", evaluator: "core.grep", settings: "pattern: [unclosed" }];
  assert.match(edit.fileSuiteEdit({ file: "unit-tests.yaml", suite: badSettings }).error, /not valid YAML/);
  const listSettings = suiteEdit();
  listSettings.steps = [{ id: "grep", evaluator: "core.grep", settings: "- a\n- b\n" }];
  assert.match(edit.fileSuiteEdit({ file: "unit-tests.yaml", suite: listSettings }).error, /must be a mapping/);

  const unknown = suiteEdit();
  unknown.steps = [{ id: "x", evaluator: "made.up" }];
  assert.match(edit.fileSuiteEdit({ file: "unit-tests.yaml", suite: unknown }).error, /No check called made\.up/);
  assert.match(edit.fileSuiteEdit({ file: "unit-tests.yaml", suite: { ...suiteEdit(), steps: [] } }).error, /at least one step/);
  assert.match(edit.fileSuiteEdit({ file: "../objectives.yaml", suite: suiteEdit() }).error, /unsafe id/);
}

// --- Approve and write puts the reviewed bytes on disk, once ------------------------
{
  const plan = edit.editDiff(filed.proposal);
  assert.equal(plan.ok, true, plan.error);
  assert.deepEqual(plan.stale, []);
  assert.equal(plan.tampered, false);
  assert.deepEqual(plan.runs.after.at(-1), ["npm", "run", "lint"]);

  assert.equal(edit.writeFiledEdit(filed.proposal, {}).status, 400, "the digest is required");
  assert.equal(edit.writeFiledEdit(filed.proposal, { digest: "0".repeat(64) }).status, 409);
  const key = `edit:${filed.proposal}:${plan.digest}`;
  const written = edit.writeFiledEdit(filed.proposal, { digest: plan.digest, rationale: "Looks right.", idempotencyKey: key });
  assert.equal(written.ok, true, written.error);
  assert.deepEqual(written.written, [".harness/evals/suites/unit-tests.yaml"]);
  assert.equal(read(suiteFile), plan.files[0].proposed);
  assert.equal(readProposal(filed.proposal).status, "validated");
  assert.equal(edit.writeFiledEdit(filed.proposal, { digest: plan.digest, idempotencyKey: key }).replayed, true);
  assert.equal(edit.writeFiledEdit(filed.proposal, { digest: plan.digest }).status, 409, "a written edit is not written again");
  const decisions = fs.readdirSync(path.join(harness, "decisions")).filter((f) => f.endsWith(".yaml"));
  assert.equal(decisions.length, 1);
  assert.deepEqual(YAML.parse(read(path.join(harness, "decisions", decisions[0]))).applied_files, [".harness/evals/suites/unit-tests.yaml"]);
}

// --- a file changed after filing refuses the write -----------------------------------
{
  const suite = suiteEdit({ aggregation: { threshold: 0.5, require_all_required: true } });
  const shown = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite });
  const late = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite, digest: shown.digest });
  fs.appendFileSync(suiteFile, "# edited by hand\n");
  const hand = read(suiteFile);
  const plan = edit.editDiff(late.proposal);
  assert.deepEqual(plan.stale, [".harness/evals/suites/unit-tests.yaml"]);
  const refused = edit.writeFiledEdit(late.proposal, { digest: plan.digest });
  assert.equal(refused.status, 409);
  assert.match(refused.error, /changed since this edit was filed/);
  assert.equal(read(suiteFile), hand, "nothing is written");
}

// --- the proposal file is not trusted -------------------------------------------------
{
  const suite = suiteEdit({ aggregation: { threshold: 0.8, require_all_required: true } });
  const shown = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite });
  const target = edit.fileSuiteEdit({ file: "unit-tests.yaml", suite, digest: shown.digest });
  const proposalFile = path.join(harness, "proposals", target.proposal);
  const original = read(proposalFile);

  // A path outside the two the editor writes.
  const moved = YAML.parse(original);
  moved.harness_edit.files[0].path = "CLAUDE.md";
  fs.writeFileSync(proposalFile, YAML.stringify(moved));
  assert.equal(edit.editDiff(target.proposal).status, 422);
  assert.equal(edit.writeFiledEdit(target.proposal, { digest: shown.digest }).status, 422);
  assert.equal(fs.existsSync(path.join(repo, "CLAUDE.md")), false);

  // Contents swapped after filing, to run a command nobody declared.
  const swapped = YAML.parse(original);
  swapped.harness_edit.files[0].contents += "  - id: extra\n    evaluator: core.command\n    metadata: { argv: [curl, example.com] }\n";
  fs.writeFileSync(proposalFile, YAML.stringify(swapped));
  const plan = edit.editDiff(target.proposal);
  assert.equal(plan.tampered, true);
  assert.equal(edit.writeFiledEdit(target.proposal, { digest: plan.digest }).status, 409);
}

// --- a new eval, and deletions ----------------------------------------------------------
{
  assert.equal(edit.readEvaluators().find((e) => e.name === "llm.judge-command").command_field, "adapter_argv");
  const fresh = { id: "brief-checks", objective: "brief-followed", commands: [], steps: [{ id: "no-markers", evaluator: "core.grep", threshold: 1, required: true, metadata: { paths_from: "changed_files", pattern: "^<<<<<<<", regex: true, should_match: false } }], aggregation: { threshold: 1, require_all_required: true } };
  assert.match(edit.fileSuiteEdit({ file: null, suite: { ...fresh, id: "unit-tests" } }).error, /already exists/);
  const shown = edit.fileSuiteEdit({ file: null, suite: fresh });
  assert.equal(shown.ok, true, shown.error);
  assert.equal(shown.files[0].status, "new");
  assert.deepEqual(shown.runs, { before: [], after: [] });
  assert.doesNotMatch(shown.files[0].proposed, /commands:/, "no empty commands list on an eval that runs none");
  const added = edit.fileSuiteEdit({ file: null, suite: fresh, digest: shown.digest });
  assert.equal(readProposal(added.proposal).scope.permissions_changed, false);
  const plan = edit.editDiff(added.proposal);
  assert.equal(edit.writeFiledEdit(added.proposal, { digest: plan.digest }).ok, true);
  assert.equal(YAML.parse(read(path.join(suites, "brief-checks.yaml"))).registries[0], "../registry.yaml");

  // Deleting an objective takes the evals that name it with it.
  const deletion = edit.fileObjectiveDeletion({ id: "brief-followed" });
  assert.equal(deletion.ok, true, deletion.error);
  assert.deepEqual(deletion.files.map((f) => [f.path, f.status]), [[".harness/objectives.yaml", "modified"], [".harness/evals/suites/brief-checks.yaml", "deleted"]]);
  const filedDeletion = edit.fileObjectiveDeletion({ id: "brief-followed", digest: deletion.digest });
  assert.ok(fs.existsSync(path.join(suites, "brief-checks.yaml")), "filing deletes nothing");
  const deletionPlan = edit.editDiff(filedDeletion.proposal);
  assert.equal(edit.writeFiledEdit(filedDeletion.proposal, { digest: deletionPlan.digest }).ok, true);
  assert.equal(fs.existsSync(path.join(suites, "brief-checks.yaml")), false);
  assert.deepEqual(YAML.parse(read(objectivesFile)).objectives.map((o) => o.id), ["tests-stay-green"]);

  const suiteDeletion = edit.fileSuiteDeletion({ file: "unit-tests.yaml" });
  assert.deepEqual(suiteDeletion.runs.after, []);
  const filedSuite = edit.fileSuiteDeletion({ file: "unit-tests.yaml", digest: suiteDeletion.digest });
  assert.match(readProposal(filedSuite.proposal).intervention.summary, /Stops running npm test/);
  assert.match(edit.fileObjectiveDeletion({ id: "nobody" }).error, /Nothing to delete/);
}

assert.ok(listProposals().every((p) => !p.malformed));
console.log("harness-edit: ok");
