import { deepEqual, equal } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assembleFeatures } from '../src/assemble.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadRegistry, workspaceAt } from '../src/workspace.ts';

function project(cli: string): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-stale-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'cli.ts'), cli);
  return root;
}

const three = "const cmd = process.argv[2];\nif (cmd === 'run') run();\nif (cmd === 'build') build();\nif (cmd === 'extra') extra();\n";

test('after a complete scan an unconfirmed candidate that is gone is dropped; a confirmed one stays stale', () => {
  const root = project(three);
  try {
    scanCommand(root);
    curateSelection(root, ['cmd-run'], 'Ada Lovelace');
    writeFileSync(join(root, 'src', 'cli.ts'), "const cmd = process.argv[2];\nif (cmd === 'serve') serve();\n");
    equal(scanCommand(root).status, 'complete');
    const features = loadRegistry(workspaceAt(root))!.features;
    deepEqual(features.map((item) => item.id), ['cmd-run', 'cmd-serve']);
    equal(features[0]!.observation.state, 'stale');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('after a partial scan located candidates stay stale; config-named and locked rows always stay', () => {
  const root = project(three);
  try {
    scanCommand(root);
    const prior = loadRegistry(workspaceAt(root))!.features;
    prior.find((item) => item.id === 'cmd-extra')!.editorial.locked = ['name'];
    const base = { scanId: 'scan-next', prior, surfaces: [], docs: [], tests: [], fileTexts: new Map<string, string>() };
    const partial = assembleFeatures({ ...base, complete: false });
    deepEqual(partial.map((item) => [item.id, item.observation.state]), [
      ['cmd-build', 'stale'],
      ['cmd-extra', 'stale'],
      ['cmd-run', 'stale'],
    ]);
    const complete = assembleFeatures({ ...base, complete: true, keep: new Set(['cmd-build']) });
    deepEqual(complete.map((item) => item.id), ['cmd-build', 'cmd-extra']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
