import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { equal, match } from 'node:assert/strict';
import { test } from 'node:test';

const bin = fileURLToPath(new URL('../bin/featurefacts.mjs', import.meta.url));

test('packaged bin invokes init, scan, and check once', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-bin-'));
  try {
    writeFileSync(join(root, 'README.md'), '# Empty test repository\n');
    const run = (command: string) => execFileSync(process.execPath, [bin, command, '--root', root], { encoding: 'utf8' });
    equal(run('init').split('Initialized FeatureFacts register.').length - 1, 1);
    const scan = run('scan');
    equal(scan.match(/^Scan /gm)?.length, 1);
    match(run('check'), /^Check passed\.\s*$/);
    match(readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8'), /Zero rows is a valid label/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
