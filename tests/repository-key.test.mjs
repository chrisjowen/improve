// Observations are kept per repository, not per working directory: every
// worktree of a repository, and every worktree of a bare mirror of its remote,
// lands in the main checkout's bucket.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  legacyDataIds,
  normalizeRemote,
  projectDataId,
  projectId,
  repositoryKey,
  resolvePluginDataDir
} from "../scripts/lib.mjs";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-repo-key-")));
const git = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "pipe" }).toString().trim();

// --- remotes -------------------------------------------------------------------
for (const url of [
  "git@github.com:me/app.git",
  "https://github.com/me/app",
  "https://user:token@GitHub.com/me/app.git/",
  "ssh://git@github.com:22/me/app.git"
]) {
  assert.equal(normalizeRemote(url), "github.com/me/app", url);
}
assert.equal(normalizeRemote("/srv/git/app.git"), undefined, "a remote on this disk has no host");
assert.equal(normalizeRemote("../app"), undefined);

// --- a checkout and its worktrees ------------------------------------------------
const checkout = path.join(temp, "app");
fs.mkdirSync(checkout);
git(checkout, "init", "-q", "-b", "main");
git(checkout, "config", "user.email", "t@example.invalid");
git(checkout, "config", "user.name", "t");
git(checkout, "remote", "add", "origin", "git@github.com:me/app.git");
fs.writeFileSync(path.join(checkout, "README.md"), "app\n");
git(checkout, "add", "-A");
git(checkout, "commit", "-q", "-m", "base");

const worktree = path.join(temp, "pool", "1", "app");
fs.mkdirSync(path.dirname(worktree), { recursive: true });
git(checkout, "worktree", "add", "-q", "-b", "task", worktree);
fs.mkdirSync(path.join(worktree, "src"));

const main = repositoryKey(checkout);
assert.deepEqual(main, { key: checkout, kind: "checkout", checkout, remote: "github.com/me/app" });
assert.deepEqual(repositoryKey(worktree), main, "a worktree belongs to its main checkout");
assert.deepEqual(repositoryKey(path.join(worktree, "src")), main, "so does a directory inside it");
// The main checkout keeps the id it always had, so its data stays where it is.
assert.equal(projectDataId(checkout), projectId(checkout));
assert.equal(projectDataId(worktree), projectId(checkout));
assert.deepEqual(legacyDataIds(checkout), []);
assert.deepEqual(legacyDataIds(worktree), [projectId(worktree)], "the worktree's old bucket is named, not moved");

// Outside git, the path is the key, as before.
const loose = path.join(temp, "loose");
fs.mkdirSync(loose);
assert.deepEqual(repositoryKey(loose), { key: loose, kind: "path", checkout: null, remote: null });
assert.equal(projectDataId(loose), projectId(loose));

// --- hooks in a worktree write to the checkout's bucket -----------------------
const data = path.join(temp, "plugin-data");
const PERSON = { FM_TASK_ID: "", CLAUDE_CODE_ENTRYPOINT: "cli", CLAUDE_CODE_SESSION_ATTENDED: "1", IMPROVE_AGENT_CHILD: "", IMPROVE_DREAM_CHILD: "" };
const hook = (script, args, root, input) => {
  const ran = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", script), ...args], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...PERSON, CLAUDE_PROJECT_DIR: root, CLAUDE_PLUGIN_DATA: data }
  });
  assert.equal(ran.status, 0, ran.stderr);
  return ran;
};
hook("session-start.mjs", [], checkout, { session_id: "main" });
hook("session-start.mjs", [], worktree, { session_id: "worker" });
hook("capture-event.mjs", ["PostToolUseFailure"], worktree, { session_id: "worker", tool_name: "Bash", error: "exit 1" });
hook("capture-prompt.mjs", [], worktree, { session_id: "worker", prompt: "no, use the existing helper" });

const buckets = fs.readdirSync(path.join(data, "projects"));
assert.deepEqual(buckets, [projectId(checkout)], "one bucket for the repository");
const state = JSON.parse(fs.readFileSync(path.join(data, "projects", projectId(checkout), "state.json"), "utf8"));
assert.equal(state.sessions_since_review, 2);
assert.equal(state.tool_failures_since_review, 1);
assert.equal(state.candidates_since_review, 1);
assert.equal(state.project_root, checkout);

// Status run in either place reads the same observations.
const env = { ...process.env, ...PERSON, CLAUDE_PLUGIN_DATA: data };
const fromWorktree = JSON.parse(spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), worktree], { encoding: "utf8", env }).stdout);
const fromCheckout = JSON.parse(spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), checkout], { encoding: "utf8", env }).stdout);
assert.equal(fromWorktree.data_location, fromCheckout.data_location);
assert.equal(fromWorktree.observations.corrections, 1);

// --- a worktree of a bare mirror of the same remote ---------------------------
// A pipeline checks worktrees out from its own bare clone, which has no main
// working tree. The checkout recorded itself as the remote's, so the mirror's
// worktrees land in its bucket too.
const mirror = path.join(temp, "mirror.git");
git(temp, "clone", "-q", "--bare", checkout, mirror);
git(mirror, "remote", "set-url", "origin", "https://github.com/me/app.git");
const run = path.join(temp, "runs", "r1");
git(mirror, "worktree", "add", "-q", "--detach", run, "main");
assert.deepEqual(repositoryKey(run), { key: "repo:github.com/me/app", kind: "remote", checkout: null, remote: "github.com/me/app" });
assert.equal(projectDataId(run, { base: data }), projectId(checkout), "the mirror finds the checkout's bucket");
hook("capture-event.mjs", ["PostToolUse"], run, { session_id: "pipeline", tool_name: "Bash" });
assert.deepEqual(fs.readdirSync(path.join(data, "projects")), [projectId(checkout)], "still one bucket");

// Before any checkout recorded itself, a mirror's worktrees still share one id.
const other = path.join(temp, "other.git");
git(temp, "clone", "-q", "--bare", checkout, other);
git(other, "remote", "set-url", "origin", "https://example.org/team/other.git");
const otherRun = path.join(temp, "runs", "o1");
git(other, "worktree", "add", "-q", "--detach", otherRun, "main");
assert.equal(projectDataId(otherRun, { base: data }), projectId("repo:example.org/team/other"));

// --- finding the data without CLAUDE_PLUGIN_DATA -------------------------------
// A worktree whose only observations are in its old path-keyed bucket still
// finds the plugin's data directory.
const home = path.join(temp, "home");
const store = path.join(home, ".claude", "plugins", "data", "improve-improve-marketplace");
fs.mkdirSync(path.join(store, "projects", projectId(worktree)), { recursive: true });
assert.deepEqual(resolvePluginDataDir(worktree, { env: {}, home }), { dir: store, source: "discovered" });

console.log("repository key tests passed");
