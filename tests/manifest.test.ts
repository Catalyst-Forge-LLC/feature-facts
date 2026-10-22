import { equal, match, ok } from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { initCommand } from '../src/commands/init.ts';
import { reportCommand } from '../src/commands/report.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { workspaceAt } from '../src/workspace.ts';

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-manifest-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src', 'cli.ts'), "const cmd = process.argv[2];\nif (cmd === 'run') run();\n");
  return root;
}

test('init and scan write the manifest that check reads', () => {
  const root = project();
  try {
    const ws = workspaceAt(root);
    const init = initCommand(root);
    ok(existsSync(ws.manifestPath));
    ok(init.changed.includes('.featurefacts/manifest.json'));
    equal(checkCommand(root).exit, 0);

    unlinkSync(ws.manifestPath);
    const scan = scanCommand(root);
    ok(scan.manifestCreated);
    ok(scan.changed.includes('.featurefacts/manifest.json'));
    equal(scanCommand(root).manifestCreated, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a missing manifest is named in check and report output', () => {
  const root = project();
  try {
    const ws = workspaceAt(root);
    scanCommand(root);
    unlinkSync(ws.manifestPath);
    const result = checkCommand(root);
    equal(result.exit, 1);
    match(result.messages.join('\n'), /\.featurefacts\/manifest\.json is missing.*Run featurefacts scan, then commit \.featurefacts\/manifest\.json/);
    equal(reportCommand(root).manifestMissing, true);
    ok(!existsSync(ws.manifestPath));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
