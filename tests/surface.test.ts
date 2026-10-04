import { equal, ok } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkCommand } from '../src/commands/check.ts';
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

test('a doc mention or a matching test filename is a sign, not availability or maturity', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-signs-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo', bin: { demo: 'dist/cli.js' } }));
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'main.ts'),
      `const argv = process.argv.slice(2);
const cmd = argv.shift();
if (cmd === 'push') {}
if (cmd === 'scan') {}
`,
    );
    writeFileSync(join(root, 'README.md'), '# Push\n\nRun `demo scan` when you want a fresh list.\nThe word push appears here without a code span.\n');
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'push.test.ts'), 'test("push", () => {});\n');
    writeFileSync(join(root, 'src', 'other.test.ts'), "test('scan', () => {});\n");

    scanCommand(root);
    const features = loadRegistry(workspaceAt(root))!.features;
    const push = features.find((item) => item.id === 'cmd-push')!;
    const scan = features.find((item) => item.id === 'cmd-scan')!;
    equal(push.docs.state, 'partial');
    equal(push.docs.result, 'linked-evidence');
    equal(push.docs.links[0]?.association, 'static-reference');
    equal(push.tests.state, 'partial');
    equal(push.tests.result, 'linked-evidence');
    equal(push.tests.links[0]?.association, 'static-reference');
    equal(scan.docs.state, 'partial');
    equal(scan.tests.state, 'unassessed');
    const checked = checkCommand(root);
    equal(checked.messages.filter((line) => line.includes('must match')).join('\n'), '');
    equal(push.availability.state, 'unknown');
    equal(push.maturity, 'unknown');
    equal(push.lifecycle, 'unknown');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
