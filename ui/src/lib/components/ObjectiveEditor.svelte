<script>
  import Icon from "./Icon.svelte";
  import Diff from "./Diff.svelte";
  import Notice from "./Notice.svelte";
  import Pill from "./Pill.svelte";
  import RunsList from "./RunsList.svelte";
  import { api } from "$lib/client/api.js";
  import { joinArgv } from "$lib/client/argv.js";

  /**
   * Edit an objective, add one, or file its deletion.
   *
   * An objective's own fields decide nothing that runs, so Save writes them
   * after the diff is confirmed. Deleting one takes the evals that measure it,
   * which changes what runs, so it is filed as a proposal instead.
   *
   * @type {{
   *   objective: any | null,
   *   suites: any[],
   *   waiting: (kind: string, id: string) => any,
   *   onclose: () => void,
   *   onsaved: (text: string) => void,
   *   onfiled: (proposal: string, text: string) => void,
   *   oneditsuite: (file: string) => void,
   *   onnewsuite: () => void
   * }}
   */
  let { objective, suites, waiting, onclose, onsaved, onfiled, oneditsuite, onnewsuite } = $props();

  // Registering an objective a suite names counts as adding it.
  const create = $derived(!objective || objective.registered === false);
  const pending = $derived(objective ? waiting("objective", objective.id) : null);

  /** @param {any} o */
  function fromObjective(o) {
    return {
      id: o?.id ?? "",
      description: o?.description ?? "",
      success_criteria: o?.success_criteria?.length ? [...o.success_criteria] : [""],
      regime: o?.regime ?? "observed",
      // A new objective aims for a full score, as the template does.
      target: o ? o.target?.suite_score ?? (typeof o.target === "number" ? o.target : null) : 1,
      owner: o?.owner ?? "",
      review_by: o?.review_by ? String(o.review_by).slice(0, 10) : ""
    };
  }
  // The form starts from the objective it was opened on; a new one is opened afresh.
  // svelte-ignore state_referenced_locally
  const initial = fromObjective(objective);
  let form = $state(structuredClone(initial));
  let stage = $state(/** @type {"edit" | "review" | "delete"} */ ("edit"));
  let shown = $state(/** @type {any} */ (null));
  let error = $state(/** @type {string | null} */ (null));
  let busy = $state(false);
  let reason = $state("");

  /** The fields to send: everything for a new objective, only what changed otherwise. */
  function fields() {
    const now = {
      description: form.description,
      success_criteria: form.success_criteria.map((c) => c.trim()).filter(Boolean),
      regime: form.regime,
      target: form.target === null || form.target === "" ? null : Number(form.target),
      owner: form.owner.trim() || null,
      review_by: form.review_by || null
    };
    const was = {
      description: initial.description,
      success_criteria: initial.success_criteria.filter(Boolean),
      regime: initial.regime,
      target: initial.target,
      owner: initial.owner || null,
      review_by: initial.review_by || null
    };
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, value] of Object.entries(now)) {
      if (create || JSON.stringify(value) !== JSON.stringify(/** @type {any} */ (was)[key])) out[key] = value;
    }
    return out;
  }
  const changed = $derived(create ? Boolean(form.id.trim() && form.description.trim()) : Object.keys(fields()).length > 0);
  const idProblem = $derived(create && !objective && form.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.id) ? "Use lowercase letters, digits and single hyphens." : null);

  async function review() {
    busy = true;
    error = null;
    try {
      shown = await api("/api/objectives", { method: "POST", body: { id: form.id.trim(), create, fields: fields() } });
      stage = "review";
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  async function save() {
    busy = true;
    error = null;
    try {
      await api("/api/objectives", { method: "POST", body: { id: form.id.trim(), create, fields: fields(), digest: shown.digest } });
      onsaved(create ? `Added ${form.id.trim()} to .harness/objectives.yaml.` : `Saved ${form.id} in .harness/objectives.yaml.`);
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
      if (/** @type {any} */ (cause).status === 409) stage = "edit";
    } finally {
      busy = false;
    }
  }

  async function askDelete() {
    busy = true;
    error = null;
    try {
      shown = await api(`/api/objectives/${encodeURIComponent(objective.id)}/delete`, { method: "POST", body: {} });
      reason = "";
      stage = "delete";
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  async function fileDeletion() {
    busy = true;
    error = null;
    try {
      const { proposal, id } = await api(`/api/objectives/${encodeURIComponent(objective.id)}/delete`, { method: "POST", body: { digest: shown.digest, reason } });
      onfiled(proposal, `Filed ${id}. Nothing is deleted until you approve it on Proposals.`);
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  function close() {
    if (stage === "edit" && !create && changed && !confirm("Discard your changes to this objective?")) return;
    onclose();
  }
</script>

<section class="panel editor" aria-labelledby="objective-editor-title">
  <div class="panel-head">
    <div class="stack" style="gap:2px">
      {#if stage !== "edit"}
        <button class="ghost small crumb" onclick={() => { stage = "edit"; error = null; }}><Icon name="arrowLeft" size={12} />Back to editing</button>
      {/if}
      <h2 id="objective-editor-title">
        {#if stage === "delete"}Delete <span class="mono">{objective.id}</span>
        {:else if !objective}New objective
        {:else}<span class="mono">{objective.id}</span>{/if}
      </h2>
    </div>
    <button class="ghost small" onclick={close} aria-label="Close the editor"><Icon name="x" size={14} /></button>
  </div>

  {#if stage === "edit"}
    <div class="editor-body">
      {#if pending}
        <Notice>A change to this objective is waiting: <a href="/proposals?p={encodeURIComponent(pending.file)}">{pending.id}</a>.</Notice>
      {/if}
      {#if objective && objective.registered === false}
        <Notice>Only an eval names this objective so far. Saving adds it to <code>.harness/objectives.yaml</code>.</Notice>
      {/if}
      <div>
        <label for="objective-id">Id</label>
        <input id="objective-id" class="mono" bind:value={form.id} readonly={Boolean(objective)} placeholder="tests-stay-green"
               aria-invalid={idProblem ? "true" : undefined} aria-describedby="objective-id-help" />
        {#if idProblem}<p id="objective-id-help" class="field-error">{idProblem}</p>
        {:else}<p id="objective-id-help" class="help">{objective ? "Evals and readings refer to it by id, so it cannot be renamed." : "Evals and readings refer to it by this id. It cannot change later."}</p>{/if}
      </div>
      <div>
        <label for="objective-description">What it means</label>
        <textarea id="objective-description" rows="2" bind:value={form.description} placeholder="One sentence: what good looks like."></textarea>
      </div>
      <fieldset class="group">
        <legend class="label">Success criteria</legend>
        {#each form.success_criteria as _, i}
          <div class="line">
            <input bind:value={form.success_criteria[i]} aria-label="Criterion {i + 1}" />
            <button class="ghost small" onclick={() => form.success_criteria.splice(i, 1)} aria-label="Remove criterion {i + 1}"><Icon name="x" size={14} /></button>
          </div>
        {/each}
        <div><button class="ghost small" onclick={() => form.success_criteria.push("")}><Icon name="plus" size={14} />Add criterion</button></div>
      </fieldset>
      <div>
        <span class="label" id="objective-regime">Graded from</span>
        <div class="segmented" role="group" aria-labelledby="objective-regime">
          <button aria-pressed={form.regime === "observed"} onclick={() => { form.regime = "observed"; }}>Observed work</button>
          <button aria-pressed={form.regime === "replayable"} onclick={() => { form.regime = "replayable"; }}>A fixed task</button>
        </div>
        <p class="help">{form.regime === "replayable" ? "A fixed task that can be run again against a changed harness." : "Graded from what actually happened, one reading per run, with nothing to compare against."}</p>
      </div>
      <div class="fields">
        <div><label for="objective-target">Target score</label><input id="objective-target" type="number" min="0" max="1" step="0.05" bind:value={form.target} /></div>
        <div><label for="objective-owner">Owner <span class="faint optional">optional</span></label><input id="objective-owner" bind:value={form.owner} /></div>
        <div><label for="objective-review">Review by <span class="faint optional">optional</span></label><input id="objective-review" type="date" bind:value={form.review_by} /></div>
      </div>

      {#if objective}
        <div class="group">
          <div class="spread">
            <span class="section-label" style="margin:0">Evals</span>
            <button class="ghost small" onclick={onnewsuite}><Icon name="plus" size={14} />New eval</button>
          </div>
          {#if suites.length}
            <ul class="list box">
              {#each suites as suite (suite.file)}
                {@const filed = waiting("suite", suite.id)}
                <li class="spread box-row">
                  <div class="grow stack" style="gap:4px">
                    <div class="row">
                      <span class="mono">{suite.id}</span>
                      <span class="small faint">{suite.steps} {suite.steps === 1 ? "step" : "steps"}{suite.threshold != null ? `, passes at ${suite.threshold}` : ""}</span>
                      {#if filed}<Pill tone="accent" title={filed.id}>Change waiting</Pill>{/if}
                    </div>
                    <div class="row small">
                      {#if suite.commands?.length}
                        <span class="faint">Runs</span>
                        {#each suite.commands as argv}<span class="chip"><Icon name="terminal" size={12} />{joinArgv(argv)}</span>{/each}
                      {:else}
                        <span class="faint row" style="gap:4px"><Icon name="eye" size={12} />Reads only; runs no command</span>
                      {/if}
                    </div>
                  </div>
                  <button class="small" onclick={() => oneditsuite(suite.file)} disabled={Boolean(suite.malformed)}><Icon name="pencil" size={13} />Edit</button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="small muted">Nothing measures this objective yet.</p>
          {/if}
        </div>
      {/if}
      {#if error}<Notice tone="bad">{error}</Notice>{/if}
    </div>
    <div class="editor-foot">
      {#if objective && objective.registered !== false}
        <button class="danger small" onclick={askDelete} disabled={busy}><Icon name="trash" size={13} />Delete</button>
      {/if}
      <span class="grow"></span>
      <button class="ghost" onclick={close}>Cancel</button>
      <button class="primary" onclick={review} disabled={busy || !changed || Boolean(idProblem)}>{busy ? "Checking…" : "Review change"}</button>
    </div>
  {:else if stage === "review"}
    <div class="editor-body">
      <p class="small muted">Saving writes <code>.harness/objectives.yaml</code> now. An objective's fields change nothing that runs, so this needs no proposal.</p>
      {#each shown.files as file}<Diff current={file.current ?? ""} proposed={file.proposed ?? ""} path={file.path} />{/each}
      {#if error}<Notice tone="bad">{error}</Notice>{/if}
    </div>
    <div class="editor-foot">
      <span class="grow"></span>
      <button class="ghost" onclick={() => { stage = "edit"; }}>Keep editing</button>
      <button class="primary" onclick={save} disabled={busy}><Icon name="check" size={14} />{busy ? "Saving…" : "Save"}</button>
    </div>
  {:else}
    <div class="editor-body">
      <p class="small muted">
        This files a proposal. Nothing is deleted until you approve it on Proposals.
        {objective.history.length ? `Its ${objective.history.length} readings stay in the results history.` : ""}
      </p>
      {#if shown.files.length > 1}
        <p class="small">The evals that measure it are deleted with it, because an eval cannot run against an objective that is gone.</p>
      {/if}
      <div>
        <div class="section-label">What runs</div>
        <RunsList before={shown.runs.before} after={shown.runs.after} />
      </div>
      <div>
        <label for="delete-reason">Why <span class="faint optional">optional, kept with the proposal</span></label>
        <textarea id="delete-reason" rows="2" bind:value={reason}></textarea>
      </div>
      {#each shown.files as file}<Diff current={file.current ?? ""} proposed={file.proposed ?? ""} path={file.path} />{/each}
      {#if error}<Notice tone="bad">{error}</Notice>{/if}
    </div>
    <div class="editor-foot">
      <span class="grow"></span>
      <button class="ghost" onclick={() => { stage = "edit"; }}>Cancel</button>
      <button class="danger" onclick={fileDeletion} disabled={busy}><Icon name="trash" size={13} />{busy ? "Filing…" : "File deletion"}</button>
    </div>
  {/if}
</section>
