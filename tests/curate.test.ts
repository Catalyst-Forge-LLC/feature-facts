import { equal, match, throws } from 'node:assert/strict';
import { existsSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { curateSelection, reviewSnapshot } from '../src/commands/curate.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadLabel, loadRegistry } from '../src/workspace.ts';
import { workspaceAt } from '../src/workspace.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('review confirms the ticked capability and leaves the rest as candidates', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-curate-'));
  try {
    cpSync(join(here, 'fixtures', 'workshop'), root, { recursive: true });
    scanCommand(root);
    const before = reviewSnapshot(root);
    const resume = before.features.find((item) => item.id === 'resume-importer');
    if (!resume) throw new Error(before.features.map((item) => item.id).join(','));
    equal(resume.selected, false);
    throws(() => curateSelection(root, Array.from({ length: 13 }, (_, i) => `extra-${i}`), 'Ada Lovelace'), /at most 12/);
    throws(() => curateSelection(root, ['nope'], 'Ada Lovelace'), /No capability nope/);
    const result = curateSelection(root, ['resume-importer'], 'Ada Lovelace');
    equal(result.selected.join(','), 'resume-importer');
    const registry = loadRegistry(workspaceAt(root))!;
    const confirmed = registry.features.find((item) => item.id === 'resume-importer')!;
    equal(confirmed.recognition, 'confirmed');
    equal(confirmed.lifecycle, 'implemented');
    const other = registry.features.find((item) => item.id !== 'resume-importer');
    if (other) equal(other.recognition, 'candidate');
    const label = loadLabel(workspaceAt(root));
    if (!label) throw new Error('expected a label');
    equal(label.data.features.map((item) => item.id).join(','), 'resume-importer');
    equal(existsSync(join(root, 'FEATURE_FACTS.md')), true);
    scanCommand(root);
    const again = loadRegistry(workspaceAt(root))!;
    equal(again.features.find((item) => item.id === 'resume-importer')?.recognition, 'confirmed');
    match(again.features.find((item) => item.id === 'resume-importer')?.description ?? '', /draft profile|Observed implementation/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
