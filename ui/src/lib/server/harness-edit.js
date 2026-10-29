import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { contain, projectRoot, readDirSafe, readTextSafe, safeId } from "./paths.js";
import { claimKey, lookupKey, readProposal, readProposalText, recordDecision, updateStatus, writeProposal } from "./proposals.js";
import { assertRealPathInside, digestOf, writeAtomic } from "./write.js";

/**
 * Objectives and evals edited from the review UI.
 *
 * Two paths, split by whether a change can widen what runs:
 *
 * - An objective's own fields (what it means, its criteria, owner, target)
 *   decide nothing that runs, so a person writes them straight to
 *   `.harness/objectives.yaml` after confirming the diff.
 * - A change to an eval suite, and every deletion, is filed as a proposal
 *   holding the exact file contents. It waits on Proposals like any other,
 *   and only "Approve and write" puts those bytes on disk.
 *
 * Every write names the digest of the change the person saw. The server
 * recomputes the change from the files as they are now, so a stale tab, an
 * edited proposal or a file changed in between is refused, not merged.
 */

const OBJECTIVES = ".harness/objectives.yaml";
const SUITES = ".harness/evals/suites";
const NEW_OBJECTIVES = "version: 1\nobjectives: []\n";
// Registry trust levels whose evaluators start a process the suite names.
const RUNS_COMMANDS = new Set(["executes-command", "external-model"]);
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// The runner reads these files with PyYAML, which follows YAML 1.1: there
// `off` is false and `1:30` is 90. Reading and writing them the same way means
// the runner gets the values the UI checked.
const RUNNER_YAML = /** @type {const} */ ({ version: "1.1" });
// Registries copied before rig 1.2.0 name no command_field, but the built-in
// evaluators' fields are known.
const BUILT_IN_COMMAND_FIELDS = new Map([["core.command", "argv"], ["llm.judge-command", "adapter_argv"]]);
const RIG_VERSION = ".harness/evals/VERSION";

/**
 * A harness file's text as the runner loads it. PyYAML reads a bare `=` or
 * `<<` as a tag it cannot construct, not as text, so those are quoted, and a
 * `<<` value is tagged as text, since this library writes it bare otherwise.
 * A `<<` key is a merge key and stays as it is.
 * @param {YAML.Document} document @param {YAML.ToStringOptions} options
 */
function runnerText(document, options) {
  YAML.visit(document, {
    Scalar(key, node) {
      if (node.value === "=") node.type = "QUOTE_DOUBLE";
      if (node.value === "<<" && key !== "key") Object.assign(node, { type: "QUOTE_DOUBLE", tag: "tag:yaml.org,2002:str" });
    }
  });
  return document.toString(options);
}

/** @typedef {{ path: string, before_digest: string | null, current: string | null, proposed: string | null, status: "new" | "modified" | "deleted" }} FileChange */

/** @param {number} status @param {string} error @param {Record<string, unknown>} [extra] */
const refuse = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });

/** @param {string} relative */
function absolute(relative) {
  return contain(projectRoot(), relative);
}

/** @param {string} relative */
function readRelative(relative) {
  return readTextSafe(absolute(relative)) ?? null;
}

/** A single digest over every file a change touches, before and after. */
export function changeDigest(/** @type {{ path: string, before_digest: string | null, proposed: string | null }[]} */ files) {
  return digestOf(JSON.stringify(files.map((f) => [f.path, f.before_digest, f.proposed])));
}

/** @param {string} relative @param {string | null} proposed @returns {FileChange} */
function fileChange(relative, proposed) {
  const current = readRelative(relative);
  return {
    path: relative,
    before_digest: current === null ? null : digestOf(current),
    current,
    proposed,
    status: current === null ? "new" : proposed === null ? "deleted" : "modified"
  };
}

/** The change as the person saw it, or as they are about to see it. */
function preview(/** @type {FileChange[]} */ files, extra = {}) {
  return { ok: true, files, digest: changeDigest(files), ...extra };
}

// ---- argv ---------------------------------------------------------------------

/** @param {unknown} value @returns {value is string[]} */
function isArgv(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item !== "");
}

/** @param {unknown} a @param {unknown} b */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- objectives ---------------------------------------------------------------

/**
 * The fields of an objective a person may write directly. None of them changes
 * which commands run: suites run, objectives only describe.
 */
const OBJECTIVE_FIELDS = new Set(["description", "success_criteria", "owner", "regime", "target", "review_by"]);

/** @param {Record<string, unknown>} fields */
function cleanObjectiveFields(fields) {
  if (!fields || typeof fields !== "object") throw new Error("fields must be an object");
  const unknown = Object.keys(fields).filter((key) => !OBJECTIVE_FIELDS.has(key));
  if (unknown.length) {
    throw new Error(`Only an objective's description, success criteria, owner, regime, target and review date can be edited here, not ${unknown.join(", ")}.`);
  }
  /** @type {Record<string, unknown>} */
  const clean = {};
  if ("description" in fields) {
    if (typeof fields.description !== "string" || !fields.description.trim()) throw new Error("Say what the objective means.");
    clean.description = fields.description.trim();
  }
  if ("success_criteria" in fields) {
    const list = fields.success_criteria;
    if (!Array.isArray(list) || list.some((item) => typeof item !== "string")) throw new Error("success_criteria must be a list of sentences");
    clean.success_criteria = list.map((item) => item.trim()).filter(Boolean);
  }
  if ("owner" in fields) {
    if (fields.owner !== null && typeof fields.owner !== "string") throw new Error("owner must be text");
    clean.owner = typeof fields.owner === "string" && fields.owner.trim() ? fields.owner.trim() : null;
  }
  if ("regime" in fields) {
    if (!["observed", "replayable", null].includes(/** @type {any} */ (fields.regime))) throw new Error("regime must be observed or replayable");
    clean.regime = fields.regime;
  }
  if ("target" in fields) {
    const target = fields.target;
    if (target !== null && (typeof target !== "number" || !Number.isFinite(target) || target < 0 || target > 1)) {
      throw new Error("The target score must be between 0 and 1.");
    }
    clean.target = target;
  }
  if ("review_by" in fields) {
    const date = fields.review_by;
    if (date !== null && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))) throw new Error("review_by must be a date, YYYY-MM-DD");
    clean.review_by = date;
  }
  return clean;
}

/** @param {string} text */
function objectivesDocument(text) {
  const document = YAML.parseDocument(text, RUNNER_YAML);
  if (document.errors.length) throw new Error(`${OBJECTIVES} could not be read: ${document.errors[0].message}`);
  if (!YAML.isMap(document.contents)) throw new Error(`${OBJECTIVES} is not a YAML mapping`);
  let list = document.get("objectives", true);
  if (list == null || (YAML.isScalar(list) && list.value == null)) {
    list = document.createNode([]);
    document.set("objectives", list);
  }
  if (!YAML.isSeq(list)) throw new Error(`objectives in ${OBJECTIVES} is not a list`);
  return { document, list };
}

/** @param {YAML.YAMLSeq} list @param {string} id */
function findObjective(list, id) {
  return list.items.find((item) => YAML.isMap(item) && item.get("id") === id);
}

/**
 * The change to `.harness/objectives.yaml` that editing or adding objective
 * `id` would make.
 *
 * @param {{ id: unknown, create?: boolean, fields: Record<string, unknown> }} input
 */
function objectiveChange({ id, create = false, fields }) {
  if (typeof id !== "string" || !id) throw new Error("An objective needs an id.");
  const clean = cleanObjectiveFields(fields);
  const current = readRelative(OBJECTIVES);
  const { document, list } = objectivesDocument(current ?? NEW_OBJECTIVES);
  let item = findObjective(list, id);
  if (create) {
    if (item) throw new Error(`An objective named ${id} already exists.`);
    // An id a suite already names may be registered as it is; a new one is kebab-case.
    if (!ID.test(id) && !suiteObjectiveIds().has(id)) throw new Error("Use lowercase letters, digits and single hyphens for the id.");
    if (!("description" in clean)) throw new Error("Say what the objective means.");
    item = /** @type {YAML.YAMLMap} */ (document.createNode({ id }));
    list.add(item);
  } else if (!item) {
    throw new Error(`No objective named ${id} in ${OBJECTIVES}.`);
  }
  const map = /** @type {YAML.YAMLMap} */ (item);
  for (const [key, value] of Object.entries(clean)) {
    if (key === "target") {
      if (value === null) map.delete("target");
      else map.setIn(["target", "suite_score"], value);
    } else if (key === "success_criteria") {
      map.set(key, document.createNode(value));
    } else {
      map.set(key, value);
    }
  }
  const proposed = runnerText(document, { lineWidth: 0 });
  if (current !== null && proposed === current) throw new Error("Nothing changed.");
  return [fileChange(OBJECTIVES, proposed)];
}

/** Objective ids named by suites, so one declared only inside a suite can be registered. */
function suiteObjectiveIds() {
  const ids = new Set();
  for (const { document } of readSuites()) {
    const objective = document?.objective;
    const id = typeof objective === "string" ? objective : objective?.id;
    if (typeof id === "string") ids.add(id);
  }
  return ids;
}

/**
 * Preview, or write, an edit to one objective's own fields.
 *
 * Without `digest` this only previews. With it, the change is recomputed from
 * the file as it is now and written only when it is still the change the
 * person confirmed.
 *
 * @param {{ id: unknown, create?: boolean, fields: Record<string, unknown>, digest?: unknown }} input
 */
export function saveObjective(input) {
  let files;
  try {
    files = objectiveChange(input);
  } catch (error) {
    return refuse(400, /** @type {Error} */ (error).message);
  }
  if (input.digest === undefined) return preview(files);
  if (input.digest !== changeDigest(files)) {
    return refuse(409, `${OBJECTIVES} changed since you reviewed it. Review the change again.`);
  }
  const target = assertRealPathInside(projectRoot(), absolute(OBJECTIVES));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  writeAtomic(target, /** @type {string} */ (files[0].proposed));
  return { ok: true, written: OBJECTIVES };
}

// ---- suites -------------------------------------------------------------------

/** Every suite file, parsed, with its raw text. */
function readSuites() {
  const dir = absolute(SUITES);
  const out = [];
  for (const entry of readDirSafe(dir)) {
    if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;
    const text = readTextSafe(path.join(dir, entry.name));
    if (text === undefined) continue;
    let document = null;
    try {
      document = YAML.parse(text, RUNNER_YAML) ?? {};
    } catch {
      // listed by listSuites as unreadable; nothing to edit here
    }
    out.push({ file: entry.name, text, document });
  }
  return out;
}

/** @param {unknown} file */
function suitePath(file) {
  const name = safeId(/** @type {string} */ (file));
  if (!/\.ya?ml$/i.test(name)) throw new Error(`not a suite file: ${name}`);
  return `${SUITES}/${name}`;
}

/**
 * Evaluators the suite's registries declare, keyed by name, with what each
 * runs. Read as data: nothing is imported or executed.
 *
 * @param {unknown} registries the suite's `registries`, relative to its folder
 */
export function readEvaluators(registries = ["../registry.yaml"]) {
  /** @type {Map<string, { name: string, description: string | null, trust: string | null, command_field: string | null }>} */
  const evaluators = new Map();
  const list = Array.isArray(registries) ? registries.filter((r) => typeof r === "string") : [];
  for (const relative of list) {
    let text;
    try {
      text = readTextSafe(contain(projectRoot(), SUITES, relative));
    } catch {
      continue;
    }
    if (text === undefined) continue;
    try {
      for (const entry of YAML.parse(text, RUNNER_YAML)?.evaluators ?? []) {
        if (typeof entry?.name !== "string") continue;
        evaluators.set(entry.name, {
          name: entry.name,
          description: typeof entry.description === "string" ? entry.description : null,
          trust: typeof entry.trust === "string" ? entry.trust : null,
          command_field: typeof entry.command_field === "string" ? entry.command_field : BUILT_IN_COMMAND_FIELDS.get(entry.name) ?? null
        });
      }
    } catch {
      // an unreadable registry offers no evaluators
    }
  }
  return [...evaluators.values()];
}

/**
 * Every command a suite runs: the ones it declares, and any a step names that
 * it does not, which the runner refuses.
 *
 * @param {any} suite parsed suite
 */
export function suiteCommands(suite) {
  const declared = Array.isArray(suite?.commands) ? suite.commands.filter(isArgv) : [];
  const evaluators = new Map(readEvaluators(suite?.registries).map((e) => [e.name, e]));
  /** @type {{ step: string, reason: string }[]} */
  const problems = [];
  for (const step of Array.isArray(suite?.steps) ? suite.steps : []) {
    const entry = evaluators.get(step?.evaluator);
    if (!entry) continue;
    if (!entry.command_field) {
      if (entry.trust && RUNS_COMMANDS.has(entry.trust)) problems.push({ step: step.id, reason: `${step.evaluator} runs a command, but its registry entry names no command_field` });
      continue;
    }
    const argv = step?.metadata?.[entry.command_field];
    if (!declared.some((/** @type {string[]} */ d) => same(d, argv))) {
      problems.push({ step: step.id, reason: isArgv(argv) ? `runs ${argv.join(" ")}, which is not declared` : `names no declared command in ${entry.command_field}` });
    }
  }
  return { declared, problems };
}

/**
 * The repository's copy of the eval rig, and whether its runner refuses a
 * command a suite does not declare. Rigs before 1.2.0 run whatever a step names.
 */
export function evalRig() {
  const installed = readRelative(RIG_VERSION)?.trim() || null;
  const [major = 0, minor = 0] = installed?.split(".").map(Number) ?? [];
  return { installed, enforces_commands: major > 1 || (major === 1 && minor >= 2) };
}

/** One suite, shaped for the editor. */
export function readSuite(/** @type {unknown} */ file) {
  const relative = suitePath(file);
  const text = readRelative(relative);
  if (text === null) return refuse(404, `no such suite: ${file}`);
  let document;
  try {
    document = YAML.parse(text, RUNNER_YAML) ?? {};
  } catch (error) {
    return refuse(422, `${relative} could not be read: ${/** @type {Error} */ (error).message}`);
  }
  const objective = document.objective;
  const evaluators = readEvaluators(document.registries);
  const fields = new Map(evaluators.map((e) => [e.name, e.command_field]));
  return {
    ok: true,
    file: path.basename(relative),
    path: relative,
    suite: {
      id: typeof document.id === "string" ? document.id : path.basename(relative).replace(/\.ya?ml$/i, ""),
      objective: typeof objective === "string" ? objective : objective?.id ?? "",
      embedded_objective: typeof objective === "object" && objective !== null,
      commands: Array.isArray(document.commands) ? document.commands : [],
      steps: (Array.isArray(document.steps) ? document.steps : []).map((/** @type {any} */ step) => {
        const metadata = step?.metadata && typeof step.metadata === "object" ? { ...step.metadata } : {};
        // The command is picked from the declared ones; every other setting is YAML.
        const field = fields.get(step?.evaluator);
        const command = field && isArgv(metadata[field]) ? metadata[field] : null;
        if (field && command) delete metadata[field];
        return {
          id: step?.id ?? "",
          evaluator: step?.evaluator ?? "",
          threshold: typeof step?.threshold === "number" ? step.threshold : 1,
          required: step?.required !== false,
          command,
          settings: Object.keys(metadata).length ? YAML.stringify(metadata, { ...RUNNER_YAML, lineWidth: 0 }) : ""
        };
      }),
      aggregation: {
        threshold: typeof document.aggregation?.threshold === "number" ? document.aggregation.threshold : 1,
        require_all_required: document.aggregation?.require_all_required !== false
      }
    },
    evaluators,
    runs: suiteCommands(document),
    rig: evalRig()
  };
}

/** @param {string} text */
function parsedRegistries(text) {
  try {
    return YAML.parse(text, RUNNER_YAML)?.registries;
  } catch {
    return undefined;
  }
}

/**
 * A step's metadata: its settings, given as YAML text or as a mapping, with
 * the command it runs in the field its evaluator names.
 * @param {any} step
 * @param {string | null | undefined} field
 */
function stepMetadata(step, field) {
  let metadata = step.metadata ?? {};
  if (typeof step.settings === "string" && step.settings.trim()) {
    try {
      metadata = YAML.parse(step.settings, RUNNER_YAML);
    } catch (error) {
      throw new Error(`Step ${step.id}'s settings are not valid YAML: ${/** @type {Error} */ (error).message}`);
    }
  }
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error(`Step ${step.id}'s settings must be a mapping.`);
  if (field && step.command != null) {
    if (!isArgv(step.command)) throw new Error(`Step ${step.id}'s command must be a non-empty list of words.`);
    metadata = { ...metadata, [field]: step.command };
  }
  return metadata;
}

/** An argv list on one line, the way a person reads a command. */
function argvNode(/** @type {YAML.Document} */ document, /** @type {string[]} */ argv) {
  const node = /** @type {YAML.YAMLSeq} */ (document.createNode(argv));
  node.flow = true;
  return node;
}

/** A step's metadata, with any argv in it on one line. */
function metadataNode(/** @type {YAML.Document} */ document, /** @type {Record<string, unknown>} */ metadata) {
  const node = /** @type {YAML.YAMLMap} */ (document.createNode({}));
  for (const [key, value] of Object.entries(metadata)) node.set(key, isArgv(value) ? argvNode(document, value) : document.createNode(value));
  return node;
}

/**
 * Set `key` only when its value changes. A key that is absent and would be
 * set to its default stays absent.
 * @param {YAML.Document} document @param {YAML.YAMLMap} map @param {string} key @param {unknown} value @param {unknown} [fallback]
 */
function setChanged(document, map, key, value, fallback) {
  if (!map.has(key)) {
    if (fallback !== undefined && same(value, fallback)) return;
  } else {
    const node = map.get(key, true);
    if (same(YAML.isNode(node) ? node.toJSON() : node, value)) return;
  }
  map.set(key, isArgv(value) ? argvNode(document, value) : document.createNode(value));
}

/**
 * The suite text an edit produces. An existing suite keeps everything the
 * editor does not show (inputs, registries, challenge cases, comments outside
 * the edited parts); a new one gets the rig's registry.
 *
 * @param {string | null} current
 * @param {any} edit
 */
function suiteText(current, edit) {
  if (!edit || typeof edit !== "object") throw new Error("suite must be an object");
  const { id, objective, commands, steps, aggregation } = edit;
  if (typeof objective !== "string" || !objective) throw new Error("Pick the objective this eval measures.");
  const registries = current === null ? ["../registry.yaml"] : parsedRegistries(current);
  const fields = new Map(readEvaluators(registries).map((e) => [e.name, e.command_field]));
  if (!Array.isArray(commands) || !commands.every(isArgv)) throw new Error("Each command must be a non-empty list of words.");
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("An eval needs at least one step.");
  const ids = new Set();
  const cleanSteps = steps.map((/** @type {any} */ step, /** @type {number} */ index) => {
    if (typeof step?.id !== "string" || !step.id.trim()) throw new Error(`Step ${index + 1} needs an id.`);
    if (ids.has(step.id)) throw new Error(`Two steps are called ${step.id}.`);
    ids.add(step.id);
    if (typeof step.evaluator !== "string" || !step.evaluator) throw new Error(`Pick a check for step ${step.id}.`);
    const threshold = Number(step.threshold ?? 1);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error(`Step ${step.id} must pass at a score between 0 and 1.`);
    const metadata = stepMetadata(step, fields.get(step.evaluator));
    return { id: step.id.trim(), evaluator: step.evaluator, threshold, required: step.required !== false, ...(Object.keys(metadata).length ? { metadata } : {}) };
  });
  const threshold = Number(aggregation?.threshold ?? 1);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error("The eval must pass at a score between 0 and 1.");
  const declared = commands.filter((argv, i) => commands.findIndex((other) => same(other, argv)) === i);

  const document = current === null
    ? new YAML.Document({ version: 1, id, objective, registries: ["../registry.yaml"] }, RUNNER_YAML)
    : YAML.parseDocument(current, RUNNER_YAML);
  if (document.errors.length) throw new Error(`The suite could not be read: ${document.errors[0].message}`);
  if (!YAML.isMap(document.contents)) throw new Error("The suite is not a YAML mapping");

  // An embedded objective stays embedded unless the eval now measures another.
  const embedded = document.get("objective");
  const embeddedId = YAML.isMap(embedded) ? embedded.get("id") : undefined;
  if (embeddedId !== objective) document.set("objective", objective);

  // Only what changed is rewritten, so the diff shows the edit and nothing else.
  const oldCommands = document.get("commands", true);
  const oldList = YAML.isSeq(oldCommands) ? oldCommands.items : [];
  if (!same(YAML.isNode(oldCommands) ? oldCommands.toJSON() : [], declared) && (declared.length || document.has("commands"))) {
    const node = /** @type {YAML.YAMLSeq} */ (document.createNode([]));
    for (const argv of declared) node.items.push(oldList.find((item) => YAML.isNode(item) && same(item.toJSON(), argv)) ?? argvNode(document, argv));
    document.set("commands", node);
  }

  const oldSteps = document.get("steps", true);
  /** @type {Map<unknown, YAML.YAMLMap>} */
  const byId = new Map();
  if (YAML.isSeq(oldSteps)) for (const node of oldSteps.items) if (YAML.isMap(node)) byId.set(node.get("id"), node);
  const stepsNode = /** @type {YAML.YAMLSeq} */ (document.createNode([]));
  for (const step of cleanSteps) {
    const node = byId.get(step.id);
    if (!node) {
      const fresh = /** @type {YAML.YAMLMap} */ (document.createNode({ ...step, metadata: undefined }));
      if (step.metadata) fresh.set("metadata", metadataNode(document, step.metadata));
      stepsNode.items.push(fresh);
      continue;
    }
    setChanged(document, node, "evaluator", step.evaluator);
    setChanged(document, node, "threshold", step.threshold, 1);
    setChanged(document, node, "required", step.required, true);
    const metadata = node.get("metadata", true);
    if (!step.metadata) node.delete("metadata");
    else if (!YAML.isMap(metadata)) node.set("metadata", metadataNode(document, step.metadata));
    else {
      for (const [key, value] of Object.entries(step.metadata)) setChanged(document, metadata, key, value);
      for (const pair of [...metadata.items]) {
        const key = YAML.isScalar(pair.key) ? pair.key.value : pair.key;
        if (!(/** @type {string} */ (key) in step.metadata)) metadata.delete(key);
      }
    }
    stepsNode.items.push(node);
  }
  document.set("steps", stepsNode);

  if (!YAML.isMap(document.get("aggregation"))) document.set("aggregation", document.createNode({}));
  const aggregationNode = /** @type {YAML.YAMLMap} */ (document.get("aggregation"));
  setChanged(document, aggregationNode, "threshold", threshold);
  setChanged(document, aggregationNode, "require_all_required", aggregation?.require_all_required !== false, true);

  const text = runnerText(document, { lineWidth: 0, flowCollectionPadding: false });
  const parsed = YAML.parse(text, RUNNER_YAML);
  const known = new Set(readEvaluators(parsed.registries).map((e) => e.name));
  const unknown = cleanSteps.filter((step) => !known.has(step.evaluator)).map((step) => step.evaluator);
  if (unknown.length) throw new Error(`No check called ${[...new Set(unknown)].join(", ")} in this eval's registries.`);
  // Refuse what the runner would refuse, so nothing undeclared is ever filed.
  const { problems } = suiteCommands(parsed);
  if (problems.length) throw new Error(`Declare every command before a step uses it: ${problems.map((p) => `${p.step} ${p.reason}`).join("; ")}.`);
  return text;
}

/**
 * The change an edit to suite `file` (or a new suite, when `file` is null)
 * would make, and the commands it runs before and after.
 *
 * @param {{ file?: unknown, suite: any }} input
 */
function suiteChange({ file, suite }) {
  let relative;
  if (file == null) {
    if (typeof suite?.id !== "string" || !ID.test(suite.id)) throw new Error("Use lowercase letters, digits and single hyphens for the eval's id.");
    relative = `${SUITES}/${suite.id}.yaml`;
    if (readRelative(relative) !== null || readRelative(`${SUITES}/${suite.id}.yml`) !== null) throw new Error(`An eval called ${suite.id} already exists.`);
  } else {
    relative = suitePath(file);
  }
  const current = readRelative(relative);
  if (file != null && current === null) throw new Error(`no such suite: ${file}`);
  const proposed = suiteText(current, file == null ? suite : { ...suite, id: undefined });
  if (proposed === current) throw new Error("Nothing changed.");
  return [fileChange(relative, proposed)];
}

/** @param {string | null} text */
function commandsOf(text) {
  if (text === null) return [];
  try {
    return suiteCommands(YAML.parse(text, RUNNER_YAML)).declared;
  } catch {
    return [];
  }
}

/** Commands before and after a change, over every suite file it touches. */
function runsOf(/** @type {FileChange[]} */ files) {
  const suites = files.filter((f) => f.path.startsWith(`${SUITES}/`));
  return {
    before: suites.flatMap((f) => commandsOf(f.current)),
    after: suites.flatMap((f) => commandsOf(f.proposed))
  };
}

// ---- deletions ----------------------------------------------------------------

/**
 * Deleting objective `id`, with every suite that measures it. A suite names
 * its objective by id, and the runner refuses an id the registry lacks, so a
 * suite left behind would only fail.
 * @param {{ id: unknown }} input
 */
function objectiveDeletion({ id }) {
  if (typeof id !== "string" || !id) throw new Error("Name the objective to delete.");
  /** @type {FileChange[]} */
  const files = [];
  const current = readRelative(OBJECTIVES);
  if (current !== null) {
    const { document, list } = objectivesDocument(current);
    const item = findObjective(list, id);
    if (item) {
      list.items.splice(list.items.indexOf(item), 1);
      files.push(fileChange(OBJECTIVES, runnerText(document, { lineWidth: 0 })));
    }
  }
  for (const { file, document } of readSuites()) {
    const objective = document?.objective;
    if ((typeof objective === "string" ? objective : objective?.id) === id) files.push(fileChange(`${SUITES}/${file}`, null));
  }
  if (!files.length) throw new Error(`Nothing to delete: ${id} is not in ${OBJECTIVES} and no eval measures it.`);
  return files;
}

// ---- filing a proposal ----------------------------------------------------------

/** @param {string} text */
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

/** @param {string[][]} before @param {string[][]} after */
function commandDelta(before, after) {
  const added = after.filter((a) => !before.some((b) => same(a, b)));
  const removed = before.filter((b) => !after.some((a) => same(a, b)));
  return { added, removed };
}

/**
 * Write the proposal for a change the person reviewed.
 *
 * @param {{ kind: string, target: string, objective: string | null, title: string, files: FileChange[], reason?: unknown }} change
 */
function fileProposal({ kind, target, objective, title, files, reason }) {
  const { before, after } = runsOf(files);
  const { added, removed } = commandDelta(before, after);
  const summary = [
    `${files.map((f) => `${f.status === "new" ? "Creates" : f.status === "deleted" ? "Deletes" : "Changes"} ${f.path}`).join(". ")}, exactly as the diff shows.`,
    added.length ? `Adds ${added.length === 1 ? "a command" : `${added.length} commands`} an eval may run: ${added.map((a) => a.join(" ")).join("; ")}.` : "",
    removed.length ? `Stops running ${removed.map((a) => a.join(" ")).join("; ")}.` : ""
  ].filter(Boolean).join(" ");
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  let name = `IMP-${stamp}-${slug(`${kind}-${target}`)}`;
  for (let n = 2; readProposalText(`${name}.yaml`) !== undefined; n += 1) name = `IMP-${stamp}-${slug(`${kind}-${target}`)}-${n}`;
  const digest = changeDigest(files);
  writeProposal(`${name}.yaml`, {
    id: name,
    title,
    layer: "evaluation",
    status: "proposed",
    owner: null,
    created_at: now.toISOString(),
    review_by: null,
    objective_id: objective,
    hypothesis: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    confidence: null,
    evidence: [],
    scope: { files: files.map((f) => f.path), systems: [], permissions_changed: added.length > 0 },
    intervention: { summary },
    evaluation: { commands: [], outputs: [] },
    risks: added.length ? ["Once written, running this eval executes the added commands in this repository."] : [],
    rollback: "Revert the files to their previous contents, shown in the diff.",
    approval: { approved_by: null, approved_at: null },
    provenance: { kind: "objectives-editor", filed_at: now.toISOString() },
    // The exact bytes to write. Approve and write checks each file is still
    // what it was when this was filed.
    harness_edit: { kind, target, digest, files: files.map(({ path: p, before_digest, proposed }) => ({ path: p, before_digest, contents: proposed })) }
  });
  return { ok: true, proposal: `${name}.yaml`, id: name };
}

/**
 * Preview, or file as a proposal, an edit to a suite or a new one.
 * @param {{ file?: unknown, suite: any, digest?: unknown, reason?: unknown }} input
 */
export function fileSuiteEdit(input) {
  let files;
  try {
    files = suiteChange(input);
  } catch (error) {
    return refuse(400, /** @type {Error} */ (error).message);
  }
  if (input.digest === undefined) return preview(files, { runs: runsOf(files) });
  if (input.digest !== changeDigest(files)) return refuse(409, "The eval changed since you reviewed it. Review the change again.");
  const id = input.file == null ? input.suite.id : path.basename(files[0].path).replace(/\.ya?ml$/i, "");
  return fileProposal({
    kind: input.file == null ? "add-eval" : "edit-eval",
    target: id,
    objective: input.suite.objective,
    title: `${input.file == null ? "Add eval" : "Change eval"} ${id}`,
    files,
    reason: input.reason
  });
}

/**
 * Preview, or file as a proposal, deleting a suite.
 * @param {{ file: unknown, digest?: unknown, reason?: unknown }} input
 */
export function fileSuiteDeletion(input) {
  let files;
  let objective = null;
  try {
    const relative = suitePath(input.file);
    const current = readRelative(relative);
    if (current === null) throw new Error(`no such suite: ${input.file}`);
    try {
      const parsed = YAML.parse(current, RUNNER_YAML);
      objective = typeof parsed?.objective === "string" ? parsed.objective : parsed?.objective?.id ?? null;
    } catch {
      // an unreadable suite can still be deleted
    }
    files = [fileChange(relative, null)];
  } catch (error) {
    return refuse(400, /** @type {Error} */ (error).message);
  }
  if (input.digest === undefined) return preview(files, { runs: runsOf(files) });
  if (input.digest !== changeDigest(files)) return refuse(409, "The eval changed since you reviewed it. Review the change again.");
  const id = path.basename(files[0].path).replace(/\.ya?ml$/i, "");
  return fileProposal({ kind: "delete-eval", target: id, objective, title: `Delete eval ${id}`, files, reason: input.reason });
}

/**
 * Preview, or file as a proposal, deleting an objective and its evals.
 * @param {{ id: unknown, digest?: unknown, reason?: unknown }} input
 */
export function fileObjectiveDeletion(input) {
  let files;
  try {
    files = objectiveDeletion(input);
  } catch (error) {
    return refuse(400, /** @type {Error} */ (error).message);
  }
  if (input.digest === undefined) return preview(files, { runs: runsOf(files) });
  if (input.digest !== changeDigest(files)) return refuse(409, "The objective or its evals changed since you reviewed it. Review the change again.");
  const id = /** @type {string} */ (input.id);
  return fileProposal({ kind: "delete-objective", target: id, objective: id, title: `Delete objective ${id}`, files, reason: input.reason });
}

// ---- writing an approved edit ------------------------------------------------------

/**
 * The only files a filed edit may write. The proposal is a file anyone can
 * edit, so its paths are checked again here, not trusted.
 * @param {unknown} relative
 */
function writablePath(relative) {
  if (relative === OBJECTIVES) return relative;
  if (typeof relative === "string" && relative.startsWith(`${SUITES}/`)) return suitePath(relative.slice(SUITES.length + 1));
  throw new Error(`a filed edit may only write ${OBJECTIVES} or a suite under ${SUITES}/, not ${relative}`);
}

/**
 * A filed edit as it stands now: each file's contents on disk against the
 * contents it would write, and whether anything moved since it was filed.
 * @param {string} file proposal file
 */
export function editDiff(file) {
  const text = readProposalText(file);
  if (text === undefined) return refuse(404, `no such proposal: ${file}`);
  let edit;
  try {
    edit = YAML.parse(text)?.harness_edit;
  } catch (error) {
    return refuse(422, `The proposal could not be read: ${/** @type {Error} */ (error).message}`);
  }
  if (!edit || !Array.isArray(edit.files) || !edit.files.length) return refuse(422, "This proposal holds no filed edit.");
  /** @type {FileChange[]} */
  const files = [];
  try {
    for (const entry of edit.files) {
      const relative = writablePath(entry?.path);
      const proposed = typeof entry.contents === "string" ? entry.contents : null;
      const before = typeof entry.before_digest === "string" ? entry.before_digest : null;
      const current = readRelative(relative);
      files.push({ path: relative, before_digest: before, current, proposed, status: before === null ? "new" : proposed === null ? "deleted" : "modified" });
    }
  } catch (error) {
    return refuse(422, /** @type {Error} */ (error).message);
  }
  const stale = files.filter((f) => (f.current === null ? null : digestOf(f.current)) !== f.before_digest).map((f) => f.path);
  const digest = changeDigest(files);
  // The proposal's own record of the change must match its contents.
  const tampered = edit.digest !== digest;
  const problems = files.filter((f) => f.path.startsWith(`${SUITES}/`) && f.proposed !== null).flatMap((f) => {
    try {
      return suiteCommands(YAML.parse(/** @type {string} */ (f.proposed), RUNNER_YAML)).problems.map((p) => `${p.step} ${p.reason}`);
    } catch (error) {
      return [`${f.path} is not valid YAML: ${/** @type {Error} */ (error).message}`];
    }
  });
  return { ok: true, kind: edit.kind ?? null, files, digest, stale, tampered, problems, runs: runsOf(files) };
}

/**
 * Approve a filed edit and write its files, exactly as reviewed.
 *
 * Like a skill draft's Approve and write: the person's one click is both the
 * approval and the write, pinned to the digest they saw. Every file must still
 * be what it was when the edit was filed, or nothing is written.
 *
 * @param {string} file proposal file
 * @param {{ digest?: unknown, rationale?: unknown, idempotencyKey?: unknown }} options
 */
export function writeFiledEdit(file, { digest, rationale, idempotencyKey } = {}) {
  if (idempotencyKey) {
    const previous = lookupKey(idempotencyKey);
    if (previous) return { ok: true, replayed: true, ...previous };
  }
  const proposal = readProposal(file);
  if (!proposal) return refuse(404, `no such proposal: ${file}`);
  if (!["draft", "proposed", "approved"].includes(proposal.status)) return refuse(409, `This proposal is already ${proposal.status}.`);
  const plan = /** @type {any} */ (editDiff(file));
  if (!plan.ok) return plan;
  if (!digest) return refuse(400, "digest is required: write the change you reviewed");
  if (digest !== plan.digest || plan.tampered) return refuse(409, "The proposal changed since you reviewed it. Review it again.");
  if (plan.stale.length) return refuse(409, `${plan.stale.join(", ")} changed since this edit was filed, so it no longer applies cleanly. Reject it and make the edit again.`);
  if (plan.problems.length) return refuse(422, `It runs a command it does not declare: ${plan.problems.join("; ")}.`);

  const root = projectRoot();
  const targets = plan.files.map((/** @type {FileChange} */ f) => ({ ...f, target: assertRealPathInside(root, absolute(f.path)) }));
  for (const f of targets) {
    if (f.proposed === null) fs.rmSync(f.target, { force: true });
    else {
      fs.mkdirSync(path.dirname(f.target), { recursive: true });
      writeAtomic(f.target, f.proposed);
    }
  }
  const applied = targets.map((/** @type {FileChange} */ f) => f.path);
  const proposalDigest = digestOf(readProposalText(file));
  const decision = recordDecision(proposal, {
    decision: "approved",
    rationale: typeof rationale === "string" && rationale.trim() ? rationale.trim() : null,
    applied_files: applied,
    digest: proposalDigest,
    idempotency_key: idempotencyKey ?? null
  });
  updateStatus(file, "validated", { approval: { approved_by: "ui", approved_at: new Date().toISOString(), digest: proposalDigest } });
  const outcome = { written: applied, decision };
  if (idempotencyKey) claimKey(idempotencyKey, outcome);
  return { ok: true, ...outcome };
}
