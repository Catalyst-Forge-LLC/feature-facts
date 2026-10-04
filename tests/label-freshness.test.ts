import { equal } from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { scanCommand } from '../src/commands/scan.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('updating the label does not mark the repo stale', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-label-fresh-'));
  try {
    cpSync(join(here, 'fixtures', 'workshop'), root, { recursive: true });
    scanCommand(root);
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    curateSelection(root, ['resume-importer'], 'Ada Lovelace');
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    curateSelection(root, ['resume-importer'], 'Ada Lovelace');
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    const pkg = join(root, 'package.json');
    const parsed = JSON.parse(readFileSync(pkg, 'utf8')) as { description?: string };
    parsed.description = 'edited after the label';
    writeFileSync(pkg, JSON.stringify(parsed));
    equal(checkCommand(root).messages.join('\n'), 'Source fingerprint is stale.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
