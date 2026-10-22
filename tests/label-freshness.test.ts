import { equal } from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { reportCommand } from '../src/commands/report.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { TOOL_VERSION } from '../src/version.ts';

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

test('build output, dependencies, and local secrets do not make a fresh clone look stale', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-label-clone-'));
  try {
    cpSync(join(here, 'fixtures', 'workshop'), root, { recursive: true });
    scanCommand(root);
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    mkdirSync(join(root, 'dist'), { recursive: true });
    writeFileSync(join(root, 'dist', 'cli.js'), 'built\n');
    mkdirSync(join(root, 'node_modules', 'left-pad'), { recursive: true });
    writeFileSync(join(root, 'node_modules', 'left-pad', 'index.js'), 'module.exports = 1;\n');
    writeFileSync(join(root, '.env'), 'TOKEN=local\n');
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    scanCommand(root);
    rmSync(join(root, 'dist'), { recursive: true, force: true });
    rmSync(join(root, 'node_modules'), { recursive: true, force: true });
    rmSync(join(root, '.env'));
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the tool reports the package version, and a label from an older version stays fresh', () => {
  const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as { version: string };
  equal(TOOL_VERSION, pkg.version);
  const root = mkdtempSync(join(tmpdir(), 'ff-label-version-'));
  try {
    cpSync(join(here, 'fixtures', 'workshop'), root, { recursive: true });
    scanCommand(root);
    curateSelection(root, ['resume-importer'], 'Ada Lovelace');
    const labelPath = join(root, 'FEATURE_FACTS.md');
    const older = readFileSync(labelPath, 'utf8').replace(/generator_version: .*/, 'generator_version: 0.2.0');
    writeFileSync(labelPath, older);
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
    reportCommand(root);
    scanCommand(root);
    equal(readFileSync(labelPath, 'utf8'), older);
    equal(checkCommand(root).messages.join('\n'), 'Check passed.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
