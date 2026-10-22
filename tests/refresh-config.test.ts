import { deepEqual, equal, ok, throws } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { initCommand } from '../src/commands/init.ts';
import { ROOT_CONFIG_EXCLUDES, refreshConfigCommand } from '../src/commands/refresh-config.ts';
import { scanCommand } from '../src/commands/scan.ts';
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
  config.exclude = [...config.exclude.filter((item) => !ROOT_CONFIG_EXCLUDES.includes(item)), 'docs/private/**'];
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
    // Only defaults that match this repo: web/ has code; there is no root script, apps/, or client/.
    deepEqual(result.added, ['web/**']);
    deepEqual(result.excluded, []);
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
    throws(() => refreshConfigCommand(mkdtempSync(join(tmpdir(), 'ff-none-'))), /No \.featurefacts\/config\.yaml found\. Run featurefacts scan/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refresh-config proposes app folders and root scripts, never root tool configs', () => {
  const root = oldLayoutProject();
  try {
    const ws = workspaceAt(root);
    writeFileSync(join(root, 'vite.config.ts'), 'export default {};\n');
    writeFileSync(join(root, 'svelte.config.js'), 'export default {};\n');
    writeFileSync(join(root, 'localhelm.plugin.mjs'), 'export default {};\n');
    // viewer/ is an app (its own package.json and code); ui/ has src/ and code; notes/ holds no code.
    mkdirSync(join(root, 'viewer', 'src', 'pages'), { recursive: true });
    writeFileSync(join(root, 'viewer', 'package.json'), JSON.stringify({ name: 'viewer' }));
    writeFileSync(join(root, 'viewer', 'src', 'pages', 'index.ts'), 'export const page = 1;\n');
    mkdirSync(join(root, 'ui', 'src'), { recursive: true });
    writeFileSync(join(root, 'ui', 'src', 'main.ts'), 'export {};\n');
    mkdirSync(join(root, 'notes'));
    writeFileSync(join(root, 'notes', 'todo.md'), '# Todo\n');
    // site/ is excluded by default even though it is an app.
    mkdirSync(join(root, 'site', 'src'), { recursive: true });
    writeFileSync(join(root, 'site', 'package.json'), '{}');
    writeFileSync(join(root, 'site', 'src', 'main.ts'), 'export {};\n');

    let result = refreshConfigCommand(root);
    deepEqual(result.added, ['web/**', 'ui/**', 'viewer/**']);
    deepEqual(result.excluded, []);

    // A root entry script earns the root glob, and the tool configs it would read are excluded.
    writeFileSync(join(root, 'serve.ts'), "const cmd = process.argv[2];\nif (cmd === 'up') up();\n");
    result = refreshConfigCommand(root, { write: true });
    deepEqual(result.added, ['*.ts', 'web/**', 'ui/**', 'viewer/**']);
    ok(result.excluded.includes('*.config.ts') && result.excluded.includes('*.config.js'));
    const config = loadConfig(ws);
    ok(config.exclude.includes('docs/private/**'));
    scanCommand(root);
    const files = JSON.parse(readFileSync(ws.manifestPath, 'utf8')).scope.files.map((item: { path: string }) => item.path);
    ok(files.includes('serve.ts'));
    ok(!files.includes('vite.config.ts'));
    deepEqual(refreshConfigCommand(root), { added: [], excluded: [], written: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
