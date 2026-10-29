/// <reference path="./text.d.ts" />
import styles from "../../../../ui/src/lib/styles.css";

/**
 * improve's own pages, drawn with Wheelhouse's theme. improve's stylesheet
 * (ui/src/lib/styles.css) draws with its own tokens; here they are Wheelhouse's
 * CSS variables, so the pages follow Wheelhouse's light and dark themes. Soft
 * fills mix a tone into the card colour, so text never sits on a translucent
 * fill. Wheelhouse's `--accent` (its hover fill) is read on the host, before
 * the app redefines `--accent` as improve's accent, Wheelhouse's sea.
 */

/** @param {string} v @param {number} pct */
const soft = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, var(--card))`;

const TOKENS = `
:host { display: block; --surface-hover: var(--accent); }
.improve-app {
  --bg: var(--background);
  --surface: var(--card);
  --surface-2: ${soft("--muted", 70)};
  --text: var(--card-foreground);
  --text-2: var(--muted-foreground);
  --text-3: color-mix(in srgb, var(--muted-foreground) 82%, var(--card));
  --border-strong: var(--input);
  --accent: var(--sea);
  --accent-text: var(--sea);
  --accent-soft: ${soft("--sea", 12)};
  --on-accent: var(--primary-foreground);
  --ok: var(--success);
  --ok-soft: ${soft("--success", 12)};
  --warn: var(--warning);
  --warn-soft: ${soft("--warning", 12)};
  --bad: var(--danger);
  --bad-soft: ${soft("--danger", 12)};
  --info: var(--muted-foreground);
  --info-soft: var(--muted);
  --add-bg: ${soft("--success", 10)};
  --add-gutter: ${soft("--success", 20)};
  --del-bg: ${soft("--danger", 10)};
  --del-gutter: ${soft("--danger", 20)};
  --focus: var(--ring);
  --radius-sm: calc(var(--radius) * 0.75);
  --shadow: none;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --sans: var(--font-sans);
  color: var(--text);
  font: 14px/1.55 var(--sans);
}
`;

/** The frame Wheelhouse's page gives improve's pages: tabs in place of improve's sidebar. */
const FRAME = `
.tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.tabs a {
  display: inline-flex; align-items: center; gap: 8px; flex: none; min-height: 38px; padding: 6px 12px;
  border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--text-2); font-weight: 500;
}
.tabs a:hover { color: var(--text); text-decoration: none; background: var(--surface-hover); }
.tabs a[aria-current="page"] { color: var(--accent-text); border-bottom-color: var(--accent); }
.tabs .count { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-3); }
.tabs a[aria-current="page"] .count { color: var(--accent-text); }
.strip { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin: -8px 0 16px; }
.page-head h1 { font-size: 18px; }
.connect { max-width: 72ch; }
.connect .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.connect pre { margin: 8px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

export const APP_STYLE = TOKENS + styles + FRAME;
