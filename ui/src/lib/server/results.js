import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { contain, ensureDir, harnessDir, readDirSafe, readTextSafe, safeId } from "./paths.js";

function evalsDir() {
  return path.join(harnessDir(), "evals");
}

function resultsDir() {
  return path.join(evalsDir(), "results");
}

export function indexFile() {
  return path.join(resultsDir(), "index.jsonl");
}

/**
 * One line per run. The full report stays in its own file; this index exists so
 * a score history can be read without parsing every report, which is what the
 * trend charts need.
 */
export function appendRun(entry) {
  const file = indexFile();
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 });
}

export function listRuns() {
  const text = readTextSafe(indexFile());
  if (text === undefined) return [];
  const runs = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      runs.push(JSON.parse(line));
    } catch {
      // A truncated append must not hide every earlier run.
      runs.push({ malformed: true });
    }
  }
  return runs;
}

export function readReport(runId) {
  const target = contain(resultsDir(), `${safeId(runId)}.json`);
  const text = readTextSafe(target);
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function reportPath(runId) {
  return contain(resultsDir(), `${safeId(runId)}.json`);
}

/** Suites, with the objective each one measures. */
export function listSuites() {
  const dir = path.join(evalsDir(), "suites");
  const suites = [];
  for (const entry of readDirSafe(dir)) {
    if (!entry.isFile() || !/\.(ya?ml)$/i.test(entry.name)) continue;
    const text = readTextSafe(path.join(dir, entry.name));
    if (text === undefined) continue;
    try {
      const document = YAML.parse(text) ?? {};
      suites.push({
        file: entry.name,
        id: document.id ?? entry.name,
        objective: document.objective ?? null,
        steps: Array.isArray(document.steps) ? document.steps.length : 0,
        threshold: document.aggregation?.threshold ?? null
      });
    } catch (error) {
      suites.push({ file: entry.name, id: entry.name, malformed: String(error.message).slice(0, 200) });
    }
  }
  return suites;
}

/**
 * Objectives are derived from suites rather than stored separately. An
 * objectives registry is a larger design change; until it exists, the suites
 * are the only place an objective is declared.
 */
export function listObjectives() {
  const runs = listRuns();
  const byObjective = new Map();
  for (const suite of listSuites()) {
    const id = suite.objective?.id;
    if (!id) continue;
    if (!byObjective.has(id)) {
      byObjective.set(id, {
        id,
        description: suite.objective.description ?? null,
        success_criteria: suite.objective.success_criteria ?? [],
        suites: [],
        history: []
      });
    }
    byObjective.get(id).suites.push(suite.id);
  }
  for (const run of runs) {
    if (run.malformed || !run.objective_id) continue;
    const objective = byObjective.get(run.objective_id);
    if (!objective) continue;
    objective.history.push({
      run_id: run.run_id,
      score: run.score,
      success: run.success,
      occurred_at: run.occurred_at,
      suite_id: run.suite_id
    });
  }
  for (const objective of byObjective.values()) {
    objective.history.sort((a, b) => String(a.occurred_at).localeCompare(String(b.occurred_at)));
    const last = objective.history.at(-1);
    const previous = objective.history.at(-2);
    objective.latest = last ?? null;
    // No reading at all is a distinct state from a bad reading.
    objective.encountered = objective.history.length > 0;
    objective.trend = last && previous && typeof last.score === "number" && typeof previous.score === "number"
      ? Number((last.score - previous.score).toFixed(4))
      : null;
  }
  return [...byObjective.values()].sort((a, b) => a.id.localeCompare(b.id));
}
