import { deepEqual, equal, match, ok } from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
import { parseFrontmatter } from '../src/yaml-io.ts';

const here = dirname(fileURLToPath(import.meta.url));

function copyFixture(name: string): string {
  const dest = mkdtempSync(join(tmpdir(), `ff-${name}-`));
  cpSync(join(here, 'fixtures', name), dest, { recursive: true });
  return dest;
}

test('init writes an empty truthful label', () => {
  const root = copyFixture('empty');
  initCommand(root);
  const label = loadLabel(workspaceAt(root));
  ok(label);
  equal(label.data.selection_state, 'not-curated');
  equal(label.data.features.length, 0);
  ok(label.data.empty_reason);
  match(label.body, /Zero rows is a valid label/);
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
  const label = loadLabel(workspaceAt(root))!;
  equal(label.data.features.length, 0);
  equal(label.data.selection_state, 'no-eligible-features');
  rmSync(root, { recursive: true, force: true });
});

test('unchanged rescan preserves IDs and does not churn timestamps', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const first = readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8');
  const firstReg = readFileSync(join(root, '.featurefacts', 'features.yaml'), 'utf8');
  scanCommand(root);
  equal(readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8'), first);
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
  config.publication.target = 'public';
  config.publication.map_link = null;
  writeText(join(root, '.featurefacts', 'config.yaml'), dumpYaml(config));
  const { reportCommand } = await import('../src/commands/report.ts');
  reportCommand(root);
  const label = loadLabel(ws)!;
  equal(label.data.audience, 'public');
  equal(label.data.features.length, 0);
  equal(label.data.map, undefined);
  match(label.body, /does not link to the private register/);
  rmSync(root, { recursive: true, force: true });
});

test('check --projection reports when freshness is skipped', () => {
  const root = copyFixture('workshop');
  scanCommand(root);
  const result = checkCommand(root, 'projection');
  ok(result.messages.some((item) => item.includes('Source freshness was not assessed')));
  rmSync(root, { recursive: true, force: true });
});

test('label frontmatter stays parseable after init', () => {
  const root = copyFixture('empty');
  initCommand(root);
  const parsed = parseFrontmatter(readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8'));
  deepEqual(Array.isArray((parsed.data as { features: unknown[] }).features), true);
  rmSync(root, { recursive: true, force: true });
});
