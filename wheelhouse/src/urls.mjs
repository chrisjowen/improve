/**
 * Links into improve's own review UI. Shared by the server entry and the UI
 * bundle, so it imports nothing.
 *
 * @typedef {import("./types.mjs").ImproveUi} ImproveUi
 */

/**
 * A proposal in improve's own UI: its own page where the UI has one, else the UI's front page.
 * @param {ImproveUi} ui @param {string} file
 */
export function proposalUrl(ui, file) {
  return ui.deepLinks ? `${ui.url}/proposals?p=${encodeURIComponent(file)}` : ui.url;
}

/** @param {ImproveUi} ui @param {string} file */
export function openUrl(ui, file) {
  return ui.running ? proposalUrl(ui, file) : null;
}

/** The Improvements page in Wheelhouse. */
export const IMPROVEMENTS = "/plugins/improve/improvements";

/**
 * A proposal on the Improvements page's Proposals view, where it can be decided.
 * @param {string} file
 */
export function proposalHref(file) {
  return `${IMPROVEMENTS}#/proposals?view=all&p=${encodeURIComponent(file)}`;
}
