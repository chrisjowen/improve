/**
 * Grade the agent's work from the transcript, not the repository's state.
 *
 * A suite that checks only whether files exist scores well on a repository no
 * agent has ever touched, which makes it evidence of nothing. Every check here
 * needs transcript evidence, so an empty transcript fails by construction.
 *
 * @param {import('../sdk/types.d.ts').EvaluationContext} context
 */
export async function evaluate(context) {
  const cfg = context.step.metadata ?? {};
  const calls = context.transcript?.tool_calls ?? [];
  const messages = context.transcript?.messages ?? [];
  const changed = (context.changes?.files ?? []).map((file) => file.path);

  const invoked = calls.filter((call) => typeof call.name === "string");
  const names = invoked.map((call) => call.name);
  const evidence = [];
  const metrics = {
    tool_calls: calls.length,
    messages: messages.length,
    changed_files: changed.length
  };

  // No transcript means no evidence of agent work, which is a failure rather
  // than a pass. Absence of evidence must never read as success.
  if (calls.length === 0 && messages.length === 0) {
    return {
      success: false,
      score: 0,
      notes: ["The transcript is empty, so there is no evidence of agent work to grade."],
      evidence: [{ kind: "transcript", message: "no messages and no tool calls" }],
      metrics
    };
  }

  const checks = [];

  // Did the agent look before it changed anything?
  if (cfg.require_read_before_edit !== false) {
    const firstEdit = names.findIndex((name) => /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(name));
    const firstRead = names.findIndex((name) => /^(Read|Grep|Glob)$/.test(name));
    const ok = firstEdit === -1 || (firstRead !== -1 && firstRead < firstEdit);
    checks.push({ id: "read-before-edit", ok });
    if (!ok) {
      evidence.push({ kind: "transcript", message: "the first edit came before any read, grep or glob" });
    }
  }

  // Was the work verified, or merely asserted complete?
  if (cfg.require_verification !== false) {
    const pattern = new RegExp(cfg.verification_pattern ?? "\\b(test|lint|typecheck|tsc|build|pytest|vitest|jest|check)\\b", "i");
    const ran = invoked.some((call) => {
      if (call.name !== "Bash") return false;
      const command = typeof call.input?.command === "string" ? call.input.command : "";
      return pattern.test(command);
    });
    checks.push({ id: "verification-run", ok: ran });
    if (!ran) {
      evidence.push({ kind: "transcript", message: "no verification command matching the pattern was run" });
    }
  }

  // Did a change to source arrive with a change to tests?
  if (cfg.require_test_alongside_source) {
    const sourcePattern = new RegExp(cfg.source_pattern ?? "\\.(js|mjs|ts|tsx|py|go|rs|java|rb)$");
    const testPattern = new RegExp(cfg.test_pattern ?? "(^|/)(tests?|__tests__|spec)/|\\.(test|spec)\\.");
    const touchedSource = changed.some((file) => sourcePattern.test(file) && !testPattern.test(file));
    const touchedTest = changed.some((file) => testPattern.test(file));
    const ok = !touchedSource || touchedTest;
    checks.push({ id: "test-alongside-source", ok });
    if (!ok) {
      evidence.push({ kind: "file", message: "source files changed with no accompanying test change" });
    }
  }

  // A tool failure left unresolved is a symptom of work that did not converge.
  if (cfg.forbid_unresolved_errors) {
    const errored = calls.filter((call) => call.is_error === true).length;
    metrics.tool_errors = errored;
    const limit = Number.isFinite(cfg.max_errors) ? cfg.max_errors : 0;
    const ok = errored <= limit;
    checks.push({ id: "errors-within-limit", ok });
    if (!ok) {
      evidence.push({ kind: "transcript", message: `${errored} failed tool calls, limit ${limit}` });
    }
  }

  if (checks.length === 0) {
    return {
      success: false,
      score: 0,
      notes: ["No checks were configured, so this step proves nothing."],
      evidence: [{ kind: "config", message: "enable at least one check in metadata" }],
      metrics
    };
  }

  const passed = checks.filter((check) => check.ok).length;
  const score = passed / checks.length;
  const failed = checks.filter((check) => !check.ok).map((check) => check.id);
  return {
    success: failed.length === 0,
    score,
    notes: failed.length
      ? [`${failed.length} of ${checks.length} checks failed: ${failed.join(", ")}.`]
      : [`All ${checks.length} transcript checks passed.`],
    evidence,
    metrics
  };
}
