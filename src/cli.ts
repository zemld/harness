#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mri from "mri";
import { runAdd } from "./commands/add.js";
import { runList } from "./commands/list.js";

const here = dirname(fileURLToPath(import.meta.url));
// Compiled entry lives at dist/cli.js, so the repo root is one level up.
const skillsRootDir = join(here, "..", "skills");
const agentsRootDir = join(here, "..", "agents", "codex");
const deltaAgentsRootDir = join(here, "..", "agents", "delta");

const argv = mri(process.argv.slice(2), {
  boolean: ["dry-run", "help"],
  alias: { h: "help" },
});
const command = argv._[0];

if (argv.help || !command) {
  printHelp();
  process.exit(0);
}

switch (command) {
  case "add":
    await runAdd({ skillsRootDir, agentsRootDir, deltaAgentsRootDir, dryRun: Boolean(argv["dry-run"]) });
    break;
  case "list":
    runList({ skillsRootDir, agentsRootDir, deltaAgentsRootDir });
    break;
  default:
    console.error(`Unknown command: ${command}\n`);
    printHelp();
    process.exit(1);
}

function printHelp(): void {
  console.log(`harness — install skills and Codex or Delta subagents

Usage:
  npx --allow-git=root github:zemld/harness add [--dry-run]   Interactive installer
  npx --allow-git=root github:zemld/harness list              List available skills and subagents

Options:
  --dry-run    Compute and print the plan without writing anything
  -h, --help   Show this help`);
}
