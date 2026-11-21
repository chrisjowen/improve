// Builds Claude Code session transcripts for tests: entries linked by
// parentUuid, the shapes a real `~/.claude/projects/*/<id>.jsonl` holds.
import fs from "node:fs";
import path from "node:path";

export function transcript(sessionId, start = "2026-11-01T10:00:00.000Z") {
  const rows = [];
  let clock = Date.parse(start);
  let last = null;
  let n = 0;
  const at = () => new Date((clock += 1000)).toISOString();
  const push = (row) => {
    const uuid = `${sessionId}-${(n += 1)}`;
    const full = { parentUuid: last, isSidechain: false, sessionId, timestamp: at(), uuid, ...row };
    rows.push(full);
    last = uuid;
    return full;
  };
  const api = {
    rows,
    meta: () => { rows.push({ type: "mode", mode: "normal", sessionId }); return api; },
    hook: (text) => { push({ type: "attachment", attachment: { type: "hook_success", hookEvent: "SessionStart", stdout: text } }); return api; },
    user: (text) => { push({ type: "user", message: { role: "user", content: text } }); return api; },
    queued: (text) => { push({ type: "attachment", attachment: { type: "queued_command", prompt: text, origin: { kind: "human" } } }); return api; },
    say: (text, { thinking } = {}) => {
      const content = [...(thinking ? [{ type: "thinking", thinking, signature: "sig" }] : []), { type: "text", text }];
      push({ type: "assistant", message: { role: "assistant", content } });
      return api;
    },
    tool: (name, input, result, { error = false } = {}) => {
      const id = `toolu_${n + 1}`;
      push({ type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id, name, input }] } });
      push({ type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: id, content: result, is_error: error }] }, toolUseResult: { stdout: result } });
      return api;
    },
    sidechain: (text) => { rows.push({ type: "user", isSidechain: true, uuid: `side-${n}`, parentUuid: null, message: { role: "user", content: text } }); return api; },
    write: (configDir, project = "-tmp-project") => {
      const dir = path.join(configDir, "projects", project);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${sessionId}.jsonl`), `${rows.map((r) => JSON.stringify(r)).join("\n")}\n{torn\n`);
      return path.join(dir, `${sessionId}.jsonl`);
    }
  };
  return api;
}
