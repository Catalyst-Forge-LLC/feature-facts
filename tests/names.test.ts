import { deepEqual, equal, match, throws } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection, parseNames } from '../src/commands/curate.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadConfig, loadRegistry, workspaceAt } from '../src/workspace.ts';

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-names-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'cli.ts'), "const cmd = process.argv[2];\nif (cmd === 'run') run();\nif (cmd === 'serve') serve();\n");
  return root;
}

test('--name values are ID=Display Name, split at the first =', () => {
  deepEqual(parseNames(['cmd-run=Run a job', 'cmd-serve=A = B', 'cmd-x=']), {
    'cmd-run': 'Run a job',
    'cmd-serve': 'A = B',
    'cmd-x': '',
  });
  throws(() => parseNames(['Run a job']), /ID=Display Name/);
  throws(() => parseNames(['=Run']), /ID=Display Name/);
});

test('review --apply --name writes curation.overrides and the label shows the name', () => {
  const root = project();
  try {
    const ws = workspaceAt(root);
    scanCommand(root);
    curateSelection(root, ['cmd-run', 'cmd-serve'], 'Ada Lovelace', undefined, { 'cmd-run': 'Run a job' });
    deepEqual(loadConfig(ws).curation.overrides, { 'cmd-run': { name: 'Run a job' } });
    match(readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8'), /Run a job/);
    // The register keeps the scan name; the override is a label choice.
    equal(loadRegistry(ws)!.features.find((item) => item.id === 'cmd-run')!.name, 'Run');
    equal(checkCommand(root).exit, 0);

    // A later apply without --name keeps the override; an empty name removes it.
    curateSelection(root, ['cmd-run', 'cmd-serve'], 'Ada Lovelace', undefined, { 'cmd-serve': 'Serve' });
    deepEqual(loadConfig(ws).curation.overrides, { 'cmd-run': { name: 'Run a job' }, 'cmd-serve': { name: 'Serve' } });
    curateSelection(root, ['cmd-run', 'cmd-serve'], 'Ada Lovelace', undefined, { 'cmd-run': '' });
    deepEqual(loadConfig(ws).curation.overrides, { 'cmd-serve': { name: 'Serve' } });

    throws(() => curateSelection(root, ['cmd-run'], 'Ada Lovelace', undefined, { 'cmd-serve': 'Serve' }), /needs --id cmd-serve/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
