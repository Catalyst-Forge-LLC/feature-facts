import { deepEqual, equal, ok, throws } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { initCommand } from '../src/commands/init.ts';
import { refreshConfigCommand } from '../src/commands/refresh-config.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { defaultConfig } from '../src/defaults.ts';
import { loadConfig, loadLabel, loadRegistry, workspaceAt, writeYaml } from '../src/workspace.ts';

const OLD_INCLUDE = ['package.json', 'README.md', 'CHANGELOG.md', 'src/**', 'app/**', 'lib/**', 'bin/**', 'docs/**', 'tests/**', 'test/**'];

function oldLayoutProject(): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-refresh-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'cli.ts'), "const cmd = process.argv[2];\nif (cmd === 'run') run();\n");
  mkdirSync(join(root, 'web', 'src', 'routes', 'board'), { recursive: true });
  writeFileSync(join(root, 'web', 'src', 'routes', 'board', '+page.svelte'), '<h1>Board</h1>\n');
  scanCommand(root);
  // A config written by an older featurefacts, with a custom exclude and an approved selection.
  const ws = workspaceAt(root);
  const config = loadConfig(ws);
  config.include = [...OLD_INCLUDE];
  config.exclude = [...config.exclude, 'docs/private/**'];
  writeYaml(ws.configPath, config);
  scanCommand(root);
  curateSelection(root, ['cmd-run'], 'Ada Lovelace');
  return root;
}

test('refresh-config only reports by default and keeps the file as it is', () => {
  const root = oldLayoutProject();
  try {
    const ws = workspaceAt(root);
    const before = readFileSync(ws.configPath, 'utf8');
    const result = refreshConfigCommand(root);
    equal(result.written, false);
    deepEqual(result.added, defaultConfig().include.filter((item) => !OLD_INCLUDE.includes(item)));
    equal(readFileSync(ws.configPath, 'utf8'), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refresh-config --write adds includes and keeps the selection, approval, and custom settings', () => {
  const root = oldLayoutProject();
  try {
    const ws = workspaceAt(root);
    const before = loadConfig(ws);
    const result = refreshConfigCommand(root, { write: true, patterns: ['web/**'] });
    deepEqual(result.added, ['web/**']);
    equal(result.written, true);
    const after = loadConfig(ws);
    deepEqual(after.include, [...OLD_INCLUDE, 'web/**']);
    deepEqual(after.exclude, before.exclude);
    deepEqual(after.curation, before.curation);
    deepEqual(after.publication, before.publication);
    // The include change makes the register stale until the next scan; the label is untouched.
    equal(checkCommand(root).exit, 1);
    scanCommand(root);
    ok(loadRegistry(ws)!.features.some((item) => item.id === 'route-board'));
    deepEqual(loadLabel(ws)!.data.features.map((row) => row.id), ['cmd-run']);
    equal(checkCommand(root).exit, 0);
    equal(refreshConfigCommand(root, { write: true, patterns: ['web/**'] }).added.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('init refuses to replace an existing register', () => {
  const root = oldLayoutProject();
  try {
    throws(() => initCommand(root), /already has a \.featurefacts\/ register/);
    throws(() => refreshConfigCommand(mkdtempSync(join(tmpdir(), 'ff-none-'))), /No \.featurefacts\/config\.yaml/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
