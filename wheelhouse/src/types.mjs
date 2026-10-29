/**
 * What improve's Wheelhouse plugin hands its elements: improve's view of the
 * Firstmate harness, already in plain words. Plain JSON, shared by the server
 * entry and the UI bundle. Types only; this module exports nothing at runtime.
 *
 * @typedef {"captain-private" | "shared-tracked" | "mixed" | null} Visibility
 *   Who a proposal's files belong to, as improve classifies them.
 *
 * @typedef {"instructions" | "skill" | "script" | "preference" | "memory" | "settings" | "docs" | "other"} Kind
 *   What kind of harness change a proposal is, from the surfaces it changes.
 *
 * @typedef {"waiting" | "drafting" | "approved" | "done" | "declined"} StatusGroup
 *   Where a proposal stands, grouped for the page.
 *
 * @typedef {object} ProposalDecision A proposal routed as a captain-held Firstmate task, and where that task stands.
 * @property {string} taskId
 * @property {string | null} href The task's page, when Wheelhouse has the task.
 * @property {string} state Plain words: "Waiting for your call", "Answered", ...
 * @property {string | null} routedAt
 * @property {boolean} changedSinceFiling The proposal was edited after it was filed.
 *
 * @typedef {object} ProposalItem
 * @property {string} file The file under `.harness/proposals/`.
 * @property {string} id
 * @property {string} title
 * @property {string} status
 * @property {string} statusLabel
 * @property {string} statusShort The status as a chip: "Your call", "Draft", "Approved"...
 * @property {StatusGroup} group
 * @property {Kind} kind
 * @property {string} kindLabel
 * @property {string | null} summary The first sentence of what it changes, for the card.
 * @property {boolean} waiting Proposed: waiting for the captain's call.
 * @property {string | null} layer
 * @property {string | null} changes What it changes, in the proposal's own words.
 * @property {string | null} why The proposal's hypothesis, else its objective.
 * @property {string[]} files
 * @property {string[]} surfaces The Firstmate surfaces it changes, in plain words.
 * @property {Visibility} visibility
 * @property {string} visibilityLabel
 * @property {string} visibilityShort The visibility as a chip: "Private", "Shared"...
 * @property {string} deliveryLabel What happens once it is approved.
 * @property {{ source: string; observation: string }[]} evidence
 * @property {string | null} confidence
 * @property {string | null} createdAt
 * @property {ProposalDecision | null} decision
 * @property {string | null} routing How routing would treat it next, when that says something the status does not.
 * @property {string} reviewHref The proposal on the Improvements page's Proposals tab, where it is decided.
 * @property {string | null} openUrl The proposal in improve's own UI, when that UI is running.
 *
 * @typedef {object} Pattern
 * @property {string} sentence
 * @property {string} example The repeated question itself, for a chip.
 * @property {"review" | "decision"} kind
 * @property {number} count
 * @property {number} tasks
 * @property {string[]} answers
 *
 * @typedef {object} ImproveUi
 * @property {string} url Where improve's UI is expected (127.0.0.1 by default).
 * @property {boolean} running
 * @property {boolean} deepLinks Whether it opens a proposal by its file (`/proposals?p=<file>`).
 * @property {string | null} start How to start it, bound to 127.0.0.1, when it is not running and Wheelhouse knows where it is.
 * @property {string | null} token The token the Improvements page sends it: the running UI's own, read from
 *   its `/api/embed`, else the one Wheelhouse hands it when it launches it (also when that read fails or times
 *   out); null when it runs and has no `/api/embed`.
 * @property {string | null} project The repository a running UI serves.
 * @property {boolean | null} servesHome Whether a running UI serves this home; null when it is not running.
 * @property {boolean} connects Whether the Improvements page can drive it: false for a running UI that has no `/api/embed`.
 *
 * @typedef {object} Review
 * @property {boolean | null} due null when periodic review is off or has not started counting.
 * @property {string} headline One sentence: due or not, and why.
 * @property {string[]} reasons
 * @property {string | null} lastReviewedAt
 * @property {string} periodic When the next periodic review comes, or that periodic review is off.
 *
 * @typedef {object} HarnessSize The harness's size, for a meter.
 * @property {string} contractFile
 * @property {number} contractTokens
 * @property {number | null} budgetShare Share of the startup memory budget, 0-1, when the home sets one.
 * @property {number | null} skills
 * @property {string | null} largestSkill
 *
 * @typedef {object} HarnessView
 * @property {"wheelhouse-improve.v1"} schema
 * @property {Review} review
 * @property {number} waiting Proposals waiting for the captain's call.
 * @property {ProposalItem[]} proposals
 * @property {{ importedAt: string | null; summary: string | null; counts: { label: string; value: number }[];
 *   mix: { key: string; label: string; value: number }[]; patterns: Pattern[] }} evidence
 * @property {string[]} inventory Short sentences about the harness's size (AGENTS.md, skills).
 * @property {HarnessSize | null} size
 * @property {string[]} problems What could not be read, in plain words.
 * @property {ImproveUi} ui
 *
 * @typedef {object} ProposalSection A routed proposal, for its Firstmate task's page.
 * @property {"wheelhouse-improve-proposal.v1"} schema
 * @property {ProposalItem} proposal
 * @property {string} improvementsHref The proposal on the Improvements page's Proposals tab.
 */

export {};
