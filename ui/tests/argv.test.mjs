import assert from "node:assert/strict";
import { joinArgv, splitArgv } from "../src/lib/client/argv.js";

// Commands are typed as one line and run as argv, with no shell in between.
assert.deepEqual(splitArgv("npm test").argv, ["npm", "test"]);
assert.deepEqual(splitArgv("  npm   run  lint ").argv, ["npm", "run", "lint"]);
assert.deepEqual(splitArgv(`python3 -c "print('hi there')"`).argv, ["python3", "-c", "print('hi there')"]);
assert.deepEqual(splitArgv("echo 'a b' c\\ d").argv, ["echo", "a b", "c d"]);
assert.deepEqual(splitArgv("").argv, []);
assert.match(splitArgv("echo 'open").error, /Close the single quote/);
assert.match(splitArgv("echo ''").error, /empty quoted word/);

for (const argv of [["npm", "test"], ["python3", "-c", "print('hi there')"], ["sh", "-c", "a && b"], ["x", "it's"]]) {
  assert.deepEqual(splitArgv(joinArgv(argv)).argv, argv, `round trip ${JSON.stringify(argv)}`);
}
assert.equal(joinArgv(["npm", "run", "lint"]), "npm run lint");
console.log("argv: ok");
