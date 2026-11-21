import { readCandidate, scoreProposal } from "../../../../scripts/replay.mjs";
import { startJob } from "./jobs.js";
import { projectDataDir, projectRoot, safeId } from "./paths.js";
import { readProposal } from "./proposals.js";

/**
 * Replay A/B from the review UI: score a proposal's candidate against the
 * replay suite, WITH and WITHOUT, as a background job. Every run is capped by
 * replay.max_cost_usd; the verdict lands in the proposal's `replay` block.
 */

/**
 * What a proposal's candidate holds, or null when it has none.
 *
 * @param {string} file
 */
export function candidateOf(file) {
  try {
    const candidate = readCandidate(projectRoot(), safeId(file));
    return candidate ? { dir: candidate.dir, kinds: candidate.kinds, workspace: candidate.workspace, files: candidate.files, digest: candidate.digest } : null;
  } catch (error) {
    return { error: /** @type {Error} */ (error).message };
  }
}

/**
 * Score `file` if it can be: it exists, nobody approved it yet, and it has a
 * candidate. The answer says why not, for the route to return.
 *
 * @param {string} file
 */
export function requestReplay(file) {
  let proposal;
  try {
    proposal = readProposal(file);
  } catch (error) {
    return { ok: false, status: 400, error: /** @type {Error} */ (error).message };
  }
  if (!proposal) return { ok: false, status: 404, error: `no such proposal: ${file}` };
  if (!["draft", "proposed"].includes(proposal.status)) {
    return { ok: false, status: 409, error: "Replay scores a proposal before it is approved, so the verdict is part of what is approved." };
  }
  if (!proposal.candidate || proposal.candidate.error) {
    return {
      ok: false,
      status: 409,
      error: proposal.candidate?.error ?? "This proposal has no candidate to replay.",
      hint: "Put the change, as it would land, in .harness/proposals/<name>.candidate/ (see references/replay.md)."
    };
  }
  const started = startReplay(file, proposal);
  if (started.error) return { ok: false, status: started.status, error: started.error, running: started.running };
  return { ok: true, job: started.job };
}

/**
 * Start scoring `file`.
 *
 * @param {string} file
 * @param {{ title: string }} proposal
 */
export function startReplay(file, proposal) {
  const name = safeId(file);
  return startJob(
    "replay",
    { title: `Replay A/B for "${proposal.title}"`, detail: { proposal: name } },
    (context) => scoreProposal({
      root: projectRoot(),
      file: name,
      dataDir: projectDataDir(),
      signal: context.signal,
      logFile: context.logFile,
      onLine: (line) => context.progress({ message: line.slice(0, 200) })
    }).then(
      (result) => ({
        ok: result.gate.verdict !== "incomplete",
        verdict: result.gate.verdict,
        with: result.validation.with,
        without: result.validation.without,
        delta: result.validation.delta,
        cost_usd: result.cost_usd,
        error: result.gate.verdict === "incomplete" ? result.gate.reasons.join(" ") : undefined
      }),
      (error) => ({ ok: false, error: /** @type {Error} */ (error).message })
    )
  );
}
