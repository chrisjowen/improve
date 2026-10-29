/**
 * A command as a person types it, and as the eval rig runs it: an argv list.
 * The rig never starts a shell, so quoting here only groups words.
 */

/**
 * Split a command line into words. Single and double quotes group a word;
 * a backslash keeps the next character as it is.
 * @param {string} text
 * @returns {{ argv: string[], error: string | null }}
 */
export function splitArgv(text) {
  /** @type {string[]} */
  const argv = [];
  let word = "";
  let started = false;
  /** @type {string | null} */
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && i + 1 < text.length) word += text[(i += 1)];
      else word += c;
    } else if (c === "'" || c === '"') {
      quote = c;
      started = true;
    } else if (c === "\\" && i + 1 < text.length) {
      word += text[(i += 1)];
      started = true;
    } else if (/\s/.test(c)) {
      if (started) argv.push(word);
      word = "";
      started = false;
    } else {
      word += c;
      started = true;
    }
  }
  if (quote) return { argv: [], error: `Close the ${quote === '"' ? "double" : "single"} quote.` };
  if (started) argv.push(word);
  if (argv.some((w) => w === "")) return { argv: [], error: "An empty quoted word is not a word the rig can run." };
  return { argv, error: null };
}

/**
 * The words back as one line, quoting any that need it.
 * @param {string[]} argv
 */
export function joinArgv(argv) {
  return argv.map((w) => (/^[\w@%+=:,./-]+$/.test(w) ? w : `'${w.replaceAll("'", `'"'"'`)}'`)).join(" ");
}
