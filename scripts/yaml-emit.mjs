/**
 * Write plain data as block YAML, and replace a top-level block of a YAML
 * document as text.
 *
 * The plugin's scripts carry no dependencies, so there is no YAML library
 * here. Every string is written as a JSON string, which YAML reads as a
 * double-quoted scalar, so no value can change meaning on the way through.
 */

/** @param {unknown} value */
function scalar(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return String(value);
  return JSON.stringify(String(value));
}

/** @param {string} key */
function keyText(key) {
  return /^[A-Za-z_][\w.-]*$/.test(key) ? key : JSON.stringify(key);
}

/** @param {unknown} value */
const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Lines for `key: value` at `indent` spaces.
 *
 * @param {string} key
 * @param {unknown} value
 * @param {number} [indent]
 * @returns {string[]}
 */
export function entryLines(key, value, indent = 0) {
  const pad = " ".repeat(indent);
  const head = `${pad}${keyText(key)}:`;
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${head} []`];
    return [head, ...value.flatMap((item) => itemLines(item, indent + 2))];
  }
  if (isMap(value)) {
    const entries = Object.entries(/** @type {Record<string, unknown>} */ (value)).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return [`${head} {}`];
    return [head, ...entries.flatMap(([k, v]) => entryLines(k, v, indent + 2))];
  }
  return [`${head} ${scalar(value)}`];
}

/**
 * Lines for one list item at `indent`.
 *
 * @param {unknown} item
 * @param {number} indent
 * @returns {string[]}
 */
function itemLines(item, indent) {
  const pad = " ".repeat(indent);
  if (isMap(item)) {
    const entries = Object.entries(/** @type {Record<string, unknown>} */ (item)).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return [`${pad}- {}`];
    const lines = entries.flatMap(([k, v]) => entryLines(k, v, indent + 2));
    lines[0] = `${pad}- ${lines[0].slice(indent + 2)}`;
    return lines;
  }
  if (Array.isArray(item)) return [`${pad}- ${JSON.stringify(item)}`];
  return [`${pad}- ${scalar(item)}`];
}

/**
 * A whole document from a map.
 *
 * @param {Record<string, unknown>} value
 */
export function toYaml(value) {
  return `${Object.entries(value).filter(([, v]) => v !== undefined).flatMap(([k, v]) => entryLines(k, v, 0)).join("\n")}\n`;
}

/**
 * The line range of top-level block `key` in `text`: its `key:` line and every
 * following line that is indented, blank, or a comment, up to the next
 * top-level line. Undefined when the key is absent.
 *
 * @param {string[]} lines
 * @param {string} key
 */
function blockRange(lines, key) {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return undefined;
  let end = start + 1;
  while (end < lines.length && (lines[end] === "" || /^[\s#]/.test(lines[end]) || lines[end].startsWith("- "))) end += 1;
  // Trailing blank lines belong to the gap, not the block.
  while (end > start + 1 && lines[end - 1].trim() === "") end -= 1;
  return { start, end };
}

/**
 * `text` with top-level block `key` replaced by `value`, or appended when it
 * is absent.
 *
 * @param {string} text
 * @param {string} key
 * @param {unknown} value
 */
export function setBlock(text, key, value) {
  const lines = text.replace(/\n+$/, "").split("\n");
  const block = entryLines(key, value, 0);
  const range = blockRange(lines, key);
  if (range) lines.splice(range.start, range.end - range.start, ...block);
  else lines.push(...block);
  return `${lines.join("\n")}\n`;
}

/**
 * `text` with keys inside top-level block `parent` replaced by `values`. Keys
 * of the block not named in `values` keep their lines as they were; a missing
 * block is created.
 *
 * @param {string} text
 * @param {string} parent
 * @param {Record<string, unknown>} values
 */
export function setInBlock(text, parent, values) {
  const lines = text.replace(/\n+$/, "").split("\n");
  const range = blockRange(lines, parent);
  if (!range) return setBlock(text, parent, values);
  // A flow value on the key's own line cannot be merged line by line.
  const inline = lines[range.start].slice(parent.length + 1).replace(/#.*$/, "").trim();
  if (inline && !["{}", "[]", "null", "~"].includes(inline)) return setBlock(text, parent, values);
  const body = lines.slice(range.start + 1, range.end);
  // Group the body into entries by their two-space key lines.
  /** @type {{ key: string | null, lines: string[] }[]} */
  const entries = [];
  for (const line of body) {
    const match = /^ {2}([^\s#][^:]*):(\s|$)/.exec(line);
    if (match) entries.push({ key: match[1].trim().replace(/^["']|["']$/g, ""), lines: [line] });
    else if (entries.length) entries.at(-1)?.lines.push(line);
    else entries.push({ key: null, lines: [line] });
  }
  const kept = entries.filter((entry) => entry.key === null || !(entry.key in values));
  const head = lines[range.start].replace(/:\s*(\{\}|\[\]|null|~)?\s*(#.*)?$/, ":");
  const rebuilt = [
    head,
    ...kept.flatMap((entry) => entry.lines),
    ...Object.entries(values).filter(([, v]) => v !== undefined).flatMap(([k, v]) => entryLines(k, v, 2))
  ];
  lines.splice(range.start, range.end - range.start, ...rebuilt);
  return `${lines.join("\n")}\n`;
}
