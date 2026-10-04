import { equal, ok } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { scanCommand } from '../src/commands/scan.ts';
import { loadRegistry } from '../src/workspace.ts';
import { workspaceAt } from '../src/workspace.ts';

test('argv commands and svelte routes are capabilities; header lookups and generated output are not', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-surface-'));
  try {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'demo', bin: { demo: 'dist/cli.js' } }),
    );
    mkdirSync(join(root, 'src', 'cli'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'cli', 'main.ts'),
      `const argv = process.argv.slice(2);
const cmd = argv.shift();
if (cmd === 'scan') {}
if (cmd === 'push') {}
headers.get('accept');
headers.delete('content-type');
`,
    );
    mkdirSync(join(root, 'src', 'lib'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'lib', 'web.ts'),
      `export function mount(app: { get: Function }) {
  app.get('/api/health', () => undefined);
  app.get('accept', () => undefined);
}
`,
    );
    mkdirSync(join(root, 'app', 'src', 'routes', 'api', 'push'), { recursive: true });
    mkdirSync(join(root, 'app', 'src', 'routes', 'deck'), { recursive: true });
    writeFileSync(join(root, 'app', 'src', 'routes', 'api', 'push', '+server.ts'), 'export const POST = () => ({});\n');
    writeFileSync(join(root, 'app', 'src', 'routes', 'deck', '+page.server.ts'), 'export const load = () => ({});\n');
    writeFileSync(join(root, 'app', 'src', 'routes', '+page.server.ts'), 'export const load = () => ({});\n');
    const generated = join(root, 'app', '.svelte-kit', 'output', 'server', 'chunks');
    mkdirSync(generated, { recursive: true });
    writeFileSync(join(generated, 'server.js'), "app.get('/fake-generated', () => undefined);\n");

    scanCommand(root);
    const features = loadRegistry(workspaceAt(root))!.features;
    const ids = features.map((item) => item.id).sort();
    equal(ids.join(','), 'cmd-push,cmd-scan,route-deck,route-health,route-home');
    const push = features.find((item) => item.id === 'cmd-push')!;
    ok(push.implements.includes('route-api-push'));
    equal(features.find((item) => item.id === 'route-deck')?.name, 'Deck');
    equal(features.find((item) => item.id === 'route-home')?.name, 'Home');
    ok(!ids.some((id) => id.includes('accept') || id.includes('fake') || id.includes('content-type') || id === 'cmd-demo'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
