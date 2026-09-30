#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadConfig, parseJson, projectRoot, readStdin, skillFromPath } from "./lib.mjs";

/**
 * Count how an applied skill is actually used.
 *
 * Applying a skill currently teaches us nothing about whether it helped. These
 * are the deterministically observable signals; a judgement of whether the
 * model *followed* a skill is deliberately not attempted, because a model
 * assessing its own compliance is not evidence.
 *
 * use  - the skill was invoked
 * view - a session read the skill's directory: recall value, not adherence
 *
 * The two are never merged. Being read is not being followed.
 */
const input = parseJson(await readStdin());
const root = projectRoot(input);

function sidecarFile(name) {
  return path.join(root, ".claude", "skills", name, ".improve.json");
}

function bump(name, counter) {
  const file = sidecarFile(name);
  let record;
  try {
    record = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    // Only skills this plugin applied carry a sidecar, and only those are counted.
    return false;
  }
  if (record.created_by !== "improve") return false;
  record[counter] = (record[counter] ?? 0) + 1;
  record[`${counter}_last_at`] = new Date().toISOString();
  record.updated_at = record[`${counter}_last_at`];
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, file);
  return true;
}

try {
  if (!loadConfig(root).capture.enabled) process.exit(0);

  const tool = typeof input.tool_name === "string" ? input.tool_name : "";
  const toolInput = input.tool_input ?? {};

  // A skill invocation names the skill directly.
  if (tool === "Skill" && typeof toolInput.skill === "string") {
    const name = toolInput.skill.includes(":") ? toolInput.skill.split(":").pop() : toolInput.skill;
    bump(name, "use");
    process.exit(0);
  }

  // Reading into a skill's directory is recall, not adherence.
  for (const field of ["file_path", "path", "notebook_path", "pattern"]) {
    const name = skillFromPath(toolInput[field]);
    if (name) {
      bump(name, "view");
      break;
    }
  }
} catch (error) {
  process.stderr.write(`improve skill usage skipped: ${error.message}\n`);
}
