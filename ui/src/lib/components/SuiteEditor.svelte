<script>
  import Icon from "./Icon.svelte";
  import Diff from "./Diff.svelte";
  import Notice from "./Notice.svelte";
  import Pill from "./Pill.svelte";
  import RunsList from "./RunsList.svelte";
  import { api } from "$lib/client/api.js";
  import { joinArgv, splitArgv } from "$lib/client/argv.js";

  /**
   * Edit an eval suite, add one, or file its deletion. Every one of these can
   * change what runs, so each is filed as a proposal holding the exact file;
   * nothing here writes the suite.
   *
   * Commands come first: a step that runs one picks it from the commands the
   * eval declares, and the runner refuses any other.
   *
   * @type {{
   *   file: string | null,
   *   objective: string,
   *   objectives: string[],
   *   waiting: (kind: string, id: string) => any,
   *   onclose: () => void,
   *   onback: (() => void) | null,
   *   onfiled: (proposal: string, text: string) => void
   * }}
   */
  let { file, objective, objectives, waiting, onclose, onback, onfiled } = $props();

  const TRUST = /** @type {Record<string, { text: string, icon: "eye" | "terminal" | "sparkles", tone: string }>} */ ({
    deterministic: { text: "Reads only", icon: "eye", tone: "" },
    "executes-command": { text: "Runs a command", icon: "terminal", tone: "warn" },
    "external-model": { text: "Calls a model", icon: "sparkles", tone: "warn" }
  });
  // Settings a new step starts with, so the person sees what each check reads.
  const STARTERS = /** @type {Record<string, string>} */ ({
    "core.transcript-evidence": "require_read_before_edit: true\nrequire_verification: true\n",
    "core.grep": "paths_from: changed_files\npattern: \"\"\nregex: true\nshould_match: false\n",
    "core.file-exists": "paths:\n  - README.md\n",
    "core.command": "expected_exit_codes: [0]\n",
    "llm.judge-command": "rubric: \"\"\n"
  });

  let loaded = $state(/** @type {any} */ (null));
  let evaluators = $state(/** @type {any[]} */ ([]));
  let form = $state(/** @type {any} */ (null));
  let initial = "";
  let stage = $state(/** @type {"edit" | "review" | "delete"} */ ("edit"));
  let shown = $state(/** @type {any} */ (null));
  let error = $state(/** @type {string | null} */ (null));
  let busy = $state(false);
  let reason = $state("");

  /** @param {any} suite */
  function toForm(suite) {
    return {
      id: suite.id,
      objective: suite.objective,
      commands: suite.commands.map((/** @type {string[]} */ argv) => joinArgv(argv)),
      steps: suite.steps.map((/** @type {any} */ step) => ({ ...step, command: step.command ? joinArgv(step.command) : "" })),
      threshold: suite.aggregation.threshold,
      require_all_required: suite.aggregation.require_all_required
    };
  }

  $effect(() => {
    const target = file;
    loaded = null;
    error = null;
    (target ? api(`/api/suites/${encodeURIComponent(target)}`) : api("/api/evaluators")).then((value) => {
      evaluators = value.evaluators ?? [];
      const suite = target ? value.suite : {
        id: `${objective}-checks`,
        objective,
        commands: [],
        steps: [{ id: "first-check", evaluator: "core.transcript-evidence", threshold: 1, required: true, command: null, settings: STARTERS["core.transcript-evidence"] }],
        aggregation: { threshold: 1, require_all_required: true }
      };
      loaded = target ? value : { suite };
      form = toForm(suite);
      initial = JSON.stringify(form);
    }).catch((cause) => { error = /** @type {Error} */ (cause).message; });
  });

  const byName = $derived(new Map(evaluators.map((e) => [e.name, e])));
  const parsed = $derived(form ? form.commands.map((/** @type {string} */ text) => splitArgv(text)) : []);
  const declared = $derived(parsed.filter((/** @type {any} */ p) => !p.error && p.argv.length).map((/** @type {any} */ p) => joinArgv(p.argv)));
  /** Steps that run a command but name none of the declared ones. */
  const undeclared = $derived(form ? form.steps.filter((/** @type {any} */ step) => byName.get(step.evaluator)?.command_field && !declared.includes(step.command)) : []);
  const commandProblem = $derived(parsed.some((/** @type {any} */ p) => p.error || !p.argv.length));
  const dirty = $derived(form ? JSON.stringify(form) !== initial : false);
  const objectiveChoices = $derived(form && !objectives.includes(form.objective) ? [form.objective, ...objectives] : objectives);
  const pending = $derived(file && loaded?.suite ? waiting("suite", loaded.suite.id) : null);

  /** The suite as the server takes it: argv lists, and each step's other settings as YAML. */
  function payload() {
    return {
      id: form.id.trim(),
      objective: form.objective,
      commands: parsed.map((/** @type {any} */ p) => p.argv),
      steps: form.steps.map((/** @type {any} */ step) => ({
        id: step.id,
        evaluator: step.evaluator,
        threshold: Number(step.threshold),
        required: step.required,
        command: byName.get(step.evaluator)?.command_field && step.command ? splitArgv(step.command).argv : null,
        settings: step.settings ?? ""
      })),
      aggregation: { threshold: Number(form.threshold), require_all_required: form.require_all_required }
    };
  }

  function addStep() {
    const n = form.steps.length + 1;
    form.steps.push({ id: `step-${n}`, evaluator: "core.grep", threshold: 1, required: true, command: "", settings: STARTERS["core.grep"] });
  }

  /** @param {any} step @param {string} name */
  function setEvaluator(step, name) {
    const before = step.evaluator;
    step.evaluator = name;
    if (!step.settings?.trim() || step.settings === STARTERS[before]) step.settings = STARTERS[name] ?? "";
    if (byName.get(name)?.command_field && !step.command) step.command = declared[0] ?? "";
  }

  /** @param {number} index */
  function removeCommand(index) {
    const gone = declared[index];
    form.commands.splice(index, 1);
    for (const step of form.steps) if (step.command === gone) step.command = "";
  }

  async function review() {
    busy = true;
    error = null;
    try {
      shown = await api("/api/suites", { method: "POST", body: { file, suite: payload() } });
      reason = "";
      stage = "review";
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  async function fileEdit() {
    busy = true;
    error = null;
    try {
      const { proposal, id } = await api("/api/suites", { method: "POST", body: { file, suite: payload(), digest: shown.digest, reason } });
      onfiled(proposal, `Filed ${id}. The eval changes only when you approve it on Proposals.`);
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  async function askDelete() {
    busy = true;
    error = null;
    try {
      shown = await api(`/api/suites/${encodeURIComponent(/** @type {string} */ (file))}/delete`, { method: "POST", body: {} });
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
      const { proposal, id } = await api(`/api/suites/${encodeURIComponent(/** @type {string} */ (file))}/delete`, { method: "POST", body: { digest: shown.digest, reason } });
      onfiled(proposal, `Filed ${id}. Nothing is deleted until you approve it on Proposals.`);
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    } finally {
      busy = false;
    }
  }

  /** @param {() => void} next */
  function leave(next) {
    if (stage === "edit" && dirty && !confirm("Discard your changes to this eval?")) return;
    next();
  }
</script>

<section class="panel editor" aria-labelledby="suite-editor-title">
  <div class="panel-head">
    <div class="stack" style="gap:2px">
      {#if stage !== "edit"}
        <button class="ghost small crumb" onclick={() => { stage = "edit"; error = null; }}><Icon name="arrowLeft" size={12} />Back to editing</button>
      {:else if onback}
        <button class="ghost small crumb" onclick={() => leave(/** @type {() => void} */ (onback))}><Icon name="arrowLeft" size={12} />{objective}</button>
      {/if}
      <h2 id="suite-editor-title">
        {#if stage === "delete"}Delete eval <span class="mono">{loaded.suite.id}</span>
        {:else if !file}New eval
        {:else}Eval <span class="mono">{loaded?.suite?.id ?? file}</span>{/if}
      </h2>
    </div>
    <button class="ghost small" onclick={() => leave(onclose)} aria-label="Close the editor"><Icon name="x" size={14} /></button>
  </div>

  {#if !form}
    <div class="editor-body">
      {#if error}<Notice tone="bad">{error}</Notice>{:else}<p class="small faint">Loading…</p>{/if}
    </div>
  {:else if stage === "edit"}
    <div class="editor-body">
      {#if pending}
        <Notice>A change to this eval is waiting: <a href="/proposals?p={encodeURIComponent(pending.file)}">{pending.id}</a>. Filing another makes a second proposal.</Notice>
      {/if}
      <div class="fields">
        <div>
          <label for="suite-id">Id</label>
          <input id="suite-id" class="mono" bind:value={form.id} readonly={Boolean(file)} aria-describedby="suite-id-help" />
          <p id="suite-id-help" class="help">The file is <code>suites/{file ?? `${form.id}.yaml`}</code>.</p>
        </div>
        <div>
          <label for="suite-objective">Measures</label>
          <select id="suite-objective" class="mono" bind:value={form.objective}>
            {#each objectiveChoices as id}<option value={id}>{id}</option>{/each}
          </select>
        </div>
      </div>

      <fieldset class="group">
        <div class="spread">
          <legend class="section-label" style="margin:0">Commands it may run</legend>
          <button class="ghost small" onclick={() => form.commands.push("")}><Icon name="plus" size={14} />Declare command</button>
        </div>
        <p class="small faint">Every command the eval runs is listed here first. A step can run only a declared command, and approving the eval approves these.</p>
        {#if form.commands.length}
          <ul class="list box">
            {#each form.commands as _, i}
              <li class="box-row">
                <div class="line">
                  <span class="faint" style="flex:none"><Icon name="terminal" size={14} /></span>
                  <input class="mono" bind:value={form.commands[i]} placeholder="npm test" aria-label="Command {i + 1}"
                         aria-invalid={parsed[i]?.error ? "true" : undefined} />
                  <button class="ghost small" onclick={() => removeCommand(i)} aria-label="Remove command {i + 1}"><Icon name="x" size={14} /></button>
                </div>
                {#if parsed[i]?.error}<p class="field-error">{parsed[i].error}</p>{/if}
              </li>
            {/each}
          </ul>
          <p class="help" style="margin-top:0">Run as words, never through a shell. Quote a word that holds spaces.</p>
        {:else}
          <p class="small muted row" style="gap:6px"><Icon name="eye" size={13} />None. This eval only reads the transcript and files.</p>
        {/if}
      </fieldset>

      <fieldset class="group">
        <div class="spread">
          <legend class="section-label" style="margin:0">Steps</legend>
          <button class="ghost small" onclick={addStep}><Icon name="plus" size={14} />Add step</button>
        </div>
        <ul class="list box">
          {#each form.steps as step, i}
            {@const info = byName.get(step.evaluator)}
            {@const trust = TRUST[info?.trust ?? ""]}
            <li class="box-row stack" style="gap:10px">
              <div class="line">
                <input class="mono" bind:value={step.id} aria-label="Step {i + 1} id" />
                <button class="ghost small" onclick={() => form.steps.splice(i, 1)} disabled={form.steps.length === 1} aria-label="Remove step {step.id}"><Icon name="trash" size={13} /></button>
              </div>
              <div class="fields step-fields">
                <div>
                  <label for="step-evaluator-{i}">Check</label>
                  <select id="step-evaluator-{i}" value={step.evaluator} onchange={(e) => setEvaluator(step, /** @type {HTMLSelectElement} */ (e.currentTarget).value)}>
                    {#if !info}<option value={step.evaluator}>{step.evaluator}</option>{/if}
                    {#each evaluators as e}<option value={e.name}>{e.name}</option>{/each}
                  </select>
                </div>
                <div><label for="step-threshold-{i}">Passes at</label><input id="step-threshold-{i}" type="number" min="0" max="1" step="0.1" bind:value={step.threshold} /></div>
                <label class="check required"><input type="checkbox" bind:checked={step.required} /><span>Required</span></label>
              </div>
              <p class="small faint row" style="gap:8px">
                {#if trust}<Pill tone={trust.tone} plain><Icon name={trust.icon} size={12} />{trust.text}</Pill>{/if}
                {info?.description ?? "Not in this eval's registries."}
              </p>
              {#if info?.command_field}
                <div>
                  <label for="step-command-{i}">Command</label>
                  <select id="step-command-{i}" class="mono" bind:value={step.command} aria-invalid={!declared.includes(step.command) ? "true" : undefined}>
                    {#if !declared.includes(step.command)}<option value={step.command}>{step.command || "Declare a command first"}</option>{/if}
                    {#each declared as command}<option value={command}>{command}</option>{/each}
                  </select>
                  <p class="help">Only the commands declared above can be picked.</p>
                </div>
              {/if}
              <div>
                <label for="step-settings-{i}">Settings <span class="faint optional">YAML, read by the check</span></label>
                <textarea id="step-settings-{i}" class="mono" rows={Math.min(6, Math.max(2, (step.settings ?? "").split("\n").length))} bind:value={step.settings}></textarea>
              </div>
            </li>
          {/each}
        </ul>
        {#if undeclared.length}
          <Notice tone="warn">{undeclared.map((/** @type {any} */ s) => s.id).join(", ")} {undeclared.length === 1 ? "runs" : "run"} no declared command. Declare one above, then pick it.</Notice>
        {/if}
      </fieldset>

      <div class="fields">
        <div><label for="suite-threshold">The eval passes at</label><input id="suite-threshold" type="number" min="0" max="1" step="0.1" bind:value={form.threshold} /></div>
        <label class="check required"><input type="checkbox" bind:checked={form.require_all_required} /><span>And every required step passes</span></label>
      </div>

      <div class="group">
        <span class="section-label" style="margin:0">What this eval runs</span>
        <RunsList before={loaded.suite.commands} after={declared.map((/** @type {string} */ c) => splitArgv(c).argv)} />
      </div>
      {#if error}<Notice tone="bad">{error}</Notice>{/if}
    </div>
    <div class="editor-foot">
      {#if file}<button class="danger small" onclick={askDelete} disabled={busy}><Icon name="trash" size={13} />Delete</button>{/if}
      <span class="grow"></span>
      <button class="ghost" onclick={() => leave(onclose)}>Cancel</button>
      <button class="primary" onclick={review} disabled={busy || !dirty || commandProblem || undeclared.length > 0}>{busy ? "Checking…" : "Review change"}</button>
    </div>
  {:else}
    <div class="editor-body">
      <p class="small muted">
        This files a proposal. {stage === "delete" ? "Nothing is deleted" : "The eval does not change"} until you approve it on Proposals, and approving writes exactly what is shown here.
      </p>
      <div class="group">
        <span class="section-label" style="margin:0">What runs</span>
        <RunsList before={shown.runs.before} after={shown.runs.after} />
      </div>
      <div>
        <label for="suite-reason">Why <span class="faint optional">optional, kept with the proposal</span></label>
        <textarea id="suite-reason" rows="2" bind:value={reason}></textarea>
      </div>
      {#each shown.files as change}<Diff current={change.current ?? ""} proposed={change.proposed ?? ""} path={change.path} />{/each}
      {#if error}<Notice tone="bad">{error}</Notice>{/if}
    </div>
    <div class="editor-foot">
      <span class="grow"></span>
      <button class="ghost" onclick={() => { stage = "edit"; }}>Keep editing</button>
      {#if stage === "delete"}
        <button class="danger" onclick={fileDeletion} disabled={busy}><Icon name="trash" size={13} />{busy ? "Filing…" : "File deletion"}</button>
      {:else}
        <button class="primary" onclick={fileEdit} disabled={busy}>{busy ? "Filing…" : "File proposal"}</button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .required { align-self: end; padding-bottom: 9px; }
  .fields.step-fields { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) max-content; }
  @media (max-width: 700px) { .fields.step-fields { grid-template-columns: 1fr; } }
</style>
