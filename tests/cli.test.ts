import { equal, match, ok } from 'node:assert/strict';
import { existsSync, mkdtempSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { initCommand } from '../src/commands/init.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { showCommand } from '../src/commands/show.ts';
import { loadLabel, loadRegistry } from '../src/workspace.ts';
import { workspaceAt } from '../src/workspace.ts';

const here = dirname(fileURLToPath(import.meta.url));

function copyFixture(name: string): string {
  const dest = mkdtempSync(join(tmpdir(), `ff-${name}-`));
  cpSync(join(here, 'fixtures', name), dest, { recursive: true });
  return dest;
}

test('init writes a register and skips a label when nothing is selected', () => {
  const root = copyFixture('empty');
  initCommand(root);
  const ws = workspaceAt(root);
  ok(loadRegistry(ws));
  equal(loadLabel(ws), null);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  rmSync(root, { recursive: true, force: true });
});

test('empty repository reports unsupported surface and zero confirmed rows', () => {
  const root = copyFixture('empty');
  const result = scanCommand(root);
  equal(result.status, 'partial');
  ok(result.diagnostics.some((item) => item.code === 'unsupported-ecosystem'));
  const registry = loadRegistry(workspaceAt(root));
  ok(registry);
  equal(registry.features.filter((item) => item.recognition === 'confirmed').length, 0);
  rmSync(root, { recursive: true, force: true });
});

test('workshop scan groups annotated routes into one candidate', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const registry = loadRegistry(workspaceAt(root))!;
  const resume = registry.features.find((item) => item.id === 'resume-importer');
  ok(resume, `features: ${registry.features.map((item) => item.id).join(',')}`);
  equal(resume.recognition, 'candidate');
  ok(resume.entry_points.length >= 2);
  equal(resume.docs.result, 'linked-evidence');
  equal(resume.tests.result, 'linked-evidence');
  const admin = registry.features.find((item) => item.id === 'admin-export');
  ok(admin);
  equal(admin.publication.scope, 'internal');
  equal(loadLabel(workspaceAt(root)), null);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  rmSync(root, { recursive: true, force: true });
});

test('unchanged rescan preserves IDs and does not churn timestamps', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  const firstReg = readFileSync(join(root, '.featurefacts', 'features.yaml'), 'utf8');
  scanCommand(root);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  equal(readFileSync(join(root, '.featurefacts', 'features.yaml'), 'utf8'), firstReg);
  rmSync(root, { recursive: true, force: true });
});

test('unknown and undisclosed stay distinct in show output', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const text = showCommand(root, 'resume-importer');
  match(text, /"lifecycle": "unknown"/);
  ok(!text.includes('"lifecycle": "undisclosed"'));
  rmSync(root, { recursive: true, force: true });
});

test('public projection omits private rows and map links', async () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const ws = workspaceAt(root);
  const registry = loadRegistry(ws)!;
  const resume = registry.features.find((item) => item.id === 'resume-importer')!;
  resume.recognition = 'confirmed';
  resume.lifecycle = 'released';
  delete resume.uncertainty_reasons.lifecycle;
  resume.publication = { scope: 'internal', reason: 'Private operator path in the fixture.' };
  const { dumpYaml, writeText } = await import('../src/yaml-io.ts');
  writeText(join(root, '.featurefacts', 'features.yaml'), dumpYaml(registry));
  const config = (await import('../src/workspace.ts')).loadConfig(ws);
  config.curation.selected_ids = ['resume-importer'];
  writeText(join(root, '.featurefacts', 'config.yaml'), dumpYaml(config));
  const { reportCommand } = await import('../src/commands/report.ts');
  reportCommand(root);
  const selected = loadLabel(ws);
  ok(selected);
  equal(selected.data.features.length, 1);
  config.publication.target = 'public';
  config.publication.map_link = null;
  writeText(join(root, '.featurefacts', 'config.yaml'), dumpYaml(config));
  reportCommand(root);
  equal(loadLabel(ws), null);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  rmSync(root, { recursive: true, force: true });
});

test('check --projection reports when freshness is skipped', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const result = checkCommand(root, 'projection');
  ok(result.messages.some((item) => item.includes('Source freshness was not assessed')));
  rmSync(root, { recursive: true, force: true });
});

test('init does not leave a parseable empty label', () => {
  const root = copyFixture('empty');
  initCommand(root);
  equal(existsSync(join(root, 'FEATURE_FACTS.md')), false);
  ok(existsSync(join(root, '.featurefacts', 'features.yaml')));
  rmSync(root, { recursive: true, force: true });
});
