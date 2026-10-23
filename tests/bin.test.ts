import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { equal } from 'node:assert/strict';
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
    equal(run('check'), 'Check passed.\n');
    equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('help lists every command with an example run', () => {
  const out = execFileSync(process.execPath, [bin, '--help'], { encoding: 'utf8' });
  for (const command of ['init', 'scan', 'review --apply', 'report', 'show', 'check', 'refresh-config']) {
    equal(out.includes(`  ${command}`), true, command);
  }
  equal(out.includes('featurefacts review --apply --root ../my-app'), true);
});
