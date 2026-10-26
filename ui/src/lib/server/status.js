import fs from "node:fs";
import path from "node:path";
import { redact } from "../../../../scripts/redact.mjs";
import { collectStatus } from "../../../../scripts/status-report.mjs";
import { pluginRoot, projectDataDir, projectRoot } from "./paths.js";

/**
 * Status for the served repository. Without a plugin data directory every
 * observed field is `null`, so the page can say "not available" instead of
 * showing a zero.
 */
export function readStatus() {
  return collectStatus(projectRoot(), { dataDir: projectDataDir(), pluginRoot: pluginRoot() });
}

/**
 * Recent session transcripts for this repository, newest first, so a person
 * can pick one instead of typing a path. The preview is the first prompt,
 * redacted and cut short: enough to recognise a session.
 */
export function listTranscripts(limit = 25) {
  const directory = readStatus().transcripts?.directory;
  if (!directory) return [];
  let names;
  try {
    names = fs.readdirSync(directory).filter((name) => name.endsWith(".jsonl"));
  } catch {
    return [];
  }
  return names
    .map((name) => {
      const file = path.join(directory, name);
      const stat = fs.statSync(file);
      return { file, name, modified: stat.mtime.toISOString(), bytes: stat.size };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified))
    .slice(0, limit)
    .map((entry) => ({ ...entry, preview: firstPrompt(entry.file) }));
}

function firstPrompt(file) {
  let text;
  try {
    const fd = fs.openSync(file, "r");
    const buffer = Buffer.alloc(64 * 1024);
    const read = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    text = buffer.toString("utf8", 0, read);
  } catch {
    return null;
  }
  for (const line of text.split("\n")) {
    try {
      const event = JSON.parse(line);
      if (event?.type !== "user") continue;
      const content = event.message?.content;
      const value = typeof content === "string" ? content
        : Array.isArray(content) ? content.find((block) => block?.type === "text")?.text : undefined;
      if (typeof value !== "string" || !value.trim() || value.startsWith("<")) continue;
      const clean = redact(value.replace(/\s+/g, " ").trim()).text;
      return clean.length > 90 ? `${clean.slice(0, 87)}…` : clean;
    } catch {
      // partial line at the end of the buffer
    }
  }
  return null;
}
