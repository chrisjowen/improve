/**
 * A small DOM builder for the elements. Text always goes in as text nodes,
 * never as HTML, and links keep only http(s) URLs and same-origin paths, as
 * Wheelhouse's own blocks do.
 */

/** @typedef {Node | string | number | null | undefined | false} Child */

/**
 * `h("p", { class: "x" }, "text", child)`. An attribute that is null, undefined
 * or false is left out; `on<event>` attributes add listeners.
 * @param {string} tag
 * @param {Record<string, unknown> | null} [attrs]
 * @param {...(Child | Child[])} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs = null, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), /** @type {EventListener} */ (v));
    else if (k === "href") {
      const href = safeHref(String(v));
      if (href) el.setAttribute("href", href);
    } else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, children);
  return el;
}

/** @param {Element} el @param {(Child | Child[])[]} children */
function append(el, children) {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
}

/**
 * Only http(s) URLs and paths on this origin; anything else is dropped.
 * @param {string} href
 */
export function safeHref(href) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:" ? href : null;
  } catch {
    return null;
  }
}

const SVG = "http://www.w3.org/2000/svg";

/**
 * A lucide icon as inline SVG, in the current text colour.
 * @param {[string, Record<string, string>][]} node lucide's icon node
 * @param {string} [cls]
 * @param {string | null} [label] an accessible name; without one the icon is hidden from assistive tech
 */
export function icon(node, cls = "icon", label = null) {
  const svg = document.createElementNS(SVG, "svg");
  for (const [k, v] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: cls
  }))
    svg.setAttribute(k, v);
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else svg.setAttribute("aria-hidden", "true");
  for (const [tag, attrs] of node) {
    const part = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) part.setAttribute(k, v);
    svg.append(part);
  }
  return svg;
}
