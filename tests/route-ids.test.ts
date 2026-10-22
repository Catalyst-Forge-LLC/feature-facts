import { deepEqual, equal, ok } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
import { curateSelection } from '../src/commands/curate.ts';
import { reportCommand } from '../src/commands/report.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadRegistry, workspaceAt, writeYaml } from '../src/workspace.ts';

const server = `import express from 'express';
const app = express();
app.get('/deck', () => undefined);
app.get('/plans/:id', () => undefined);
app.post('/plans/:id', () => undefined);
app.post('/plans/:id/accept', () => undefined);
`;

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'ff-route-ids-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  mkdirSync(join(root, 'src', 'routes', 'plans', '[id]', 'move'), { recursive: true });
  writeFileSync(join(root, 'src', 'server.ts'), server);
  writeFileSync(join(root, 'src', 'routes', 'plans', '[id]', 'move', '+server.ts'), 'export function POST() {}\n');
  return root;
}

test('a route ID is its URL path at every depth, without the HTTP verb', () => {
  const root = project();
  try {
    scanCommand(root);
    const ids = loadRegistry(workspaceAt(root))!.features.map((item) => item.id).sort();
    deepEqual(ids, ['route-deck', 'route-plans-id', 'route-plans-id-accept', 'route-plans-id-move']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a row confirmed under the older verb-bearing ID keeps it, and its label does not change', () => {
  const root = project();
  try {
    const ws = workspaceAt(root);
    scanCommand(root);
    // What an adapter 0.2.3 scan named this route.
    const registry = loadRegistry(ws)!;
    const row = registry.features.find((item) => item.id === 'route-plans-id-accept')!;
    row.id = 'route-post-plans-id-accept';
    writeYaml(ws.featuresPath, registry);
    curateSelection(root, ['route-post-plans-id-accept', 'route-deck'], 'Ada Lovelace');
    const label = readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8');

    scanCommand(root);
    reportCommand(root);
    const features = loadRegistry(ws)!.features;
    const ids = features.map((item) => item.id);
    ok(ids.includes('route-post-plans-id-accept'));
    ok(!ids.includes('route-plans-id-accept'));
    const kept = features.find((item) => item.id === 'route-post-plans-id-accept')!;
    equal(kept.observation.state, 'current');
    deepEqual(kept.editorial.aliases, ['route-plans-id-accept']);
    equal(readFileSync(join(root, 'FEATURE_FACTS.md'), 'utf8'), label);
    equal(checkCommand(root).exit, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
