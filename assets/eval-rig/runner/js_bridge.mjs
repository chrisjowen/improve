import { pathToFileURL } from "node:url";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const module = await import(pathToFileURL(request.module).href);
const evaluator = module[request.export ?? "evaluate"];
if (typeof evaluator !== "function") throw new Error(`Missing evaluator export: ${request.export ?? "evaluate"}`);
const result = await evaluator(request.context);
process.stdout.write(JSON.stringify(result));
