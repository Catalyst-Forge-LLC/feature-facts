import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entries = process.argv.slice(2);
if (entries.length === 0) {
  console.error("usage: node scripts/build.mjs <src/entry.ts>...");
  process.exit(2);
}

rmSync(join(root, "dist"), { recursive: true, force: true });
await esbuild.build({
  absWorkingDir: root,
  entryPoints: entries,
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist",
  outbase: "src",
  packages: "external",
  target: "node22",
  logLevel: "info",
});

function fixShebangs(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      fixShebangs(path);
      continue;
    }
    if (!name.name.endsWith(".js")) continue;
    const text = readFileSync(path, "utf8");
    if (!text.startsWith("#!")) continue;
    writeFileSync(path, text.replace(/^#![^\n]*\n/, "#!/usr/bin/env node\n"));
  }
}
fixShebangs(join(root, "dist"));
