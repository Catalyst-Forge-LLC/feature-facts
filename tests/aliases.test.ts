import { deepEqual, equal, ok } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadLabel, loadRegistry, workspaceAt } from '../src/workspace.ts';

function project(cli: string): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-aliases-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'cli.ts'), cli);
  return root;
}

const grouped = `const cmd = process.argv[2];
switch (cmd) {
  case 'health':
  // older name
  case 'scrape-health':
    health();
    break;
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  case 'run':
    run();
    break;
}
if (cmd === 'start' || cmd === 'serve') start();
`;

test('commands that share one branch are one candidate with recorded aliases', () => {
  const root = project(grouped);
  try {
    scanCommand(root);
    const features = loadRegistry(workspaceAt(root))!.features;
    deepEqual(features.map((item) => item.id).sort(), ['cmd-health', 'cmd-help', 'cmd-run', 'cmd-start']);
    deepEqual(features.find((item) => item.id === 'cmd-health')!.editorial.aliases, ['cmd-scrape-health']);
    deepEqual(features.find((item) => item.id === 'cmd-start')!.editorial.aliases, ['cmd-serve']);
    deepEqual(features.find((item) => item.id === 'cmd-run')!.editorial.aliases, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a selected ID survives when its command turns out to be an alias', () => {
  const separate = `const cmd = process.argv[2];
if (cmd === 'start') start();
if (cmd === 'serve') start();
switch (cmd) {
  case 'health':
    health();
    break;
  case 'scrape-health':
    health();
    break;
}
`;
  const root = project(separate);
  try {
    scanCommand(root);
    curateSelection(root, ['cmd-serve', 'cmd-health'], 'Ada Lovelace');
    writeFileSync(join(root, 'src', 'cli.ts'), grouped);
    scanCommand(root);
    const ws = workspaceAt(root);
    const features = loadRegistry(ws)!.features;
    const ids = features.map((item) => item.id).sort();
    // cmd-serve was confirmed, so it stays the identity and start becomes its alias.
    ok(ids.includes('cmd-serve'));
    ok(!ids.includes('cmd-start'));
    deepEqual(features.find((item) => item.id === 'cmd-serve')!.editorial.aliases, ['cmd-start']);
    equal(features.find((item) => item.id === 'cmd-serve')!.observation.state, 'current');
    // The unconfirmed scrape-health candidate is folded into health instead of lingering as stale.
    ok(!ids.includes('cmd-scrape-health'));
    deepEqual(loadLabel(ws)!.data.features.map((row) => row.id), ['cmd-serve', 'cmd-health']);
    equal(checkCommand(root).exit, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
