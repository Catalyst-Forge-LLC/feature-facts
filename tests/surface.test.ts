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

test('only a switch on an argv value names commands; a JSON-RPC method switch does not', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-switch-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo', bin: { demo: 'dist/cli.js' } }));
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'cli.ts'),
      `const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'serve': {
    switch (mode) {
      case 'inner-mode':
        break;
    }
    break;
  }
  // case 'commented-out':
  case "pull":
    console.log('case "not-a-label":');
    break;
}
switch (process.argv[3]) {
  case 'extra':
    break;
}
`,
    );
    writeFileSync(
      join(root, 'src', 'mcp.ts'),
      `if (process.argv.includes('--help')) printHelp();
export function handle(method: string) {
  switch (method) {
    case "initialize":
      return init();
    case "ping":
      return {};
  }
}
`,
    );

    scanCommand(root);
    const ids = loadRegistry(workspaceAt(root))!.features.map((item) => item.id).sort();
    equal(ids.join(','), 'cmd-extra,cmd-pull,cmd-serve');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('test files, fixtures, and package.json prose are not product surfaces', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-tests-not-surface-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo', description: 'FeatureFacts: a sample package' }));
    mkdirSync(join(root, 'src', '__tests__'), { recursive: true });
    mkdirSync(join(root, 'tests', 'fixtures', 'app', 'src'), { recursive: true });
    mkdirSync(join(root, 'test'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'cli.ts'),
      `const cmd = process.argv[2];
if (cmd === 'real') {}
`,
    );
    const sample = `const cmd = process.argv[2];
if (cmd === 'fake') {}
app.get('/fake-route', () => undefined);
`;
    writeFileSync(join(root, 'src', 'cli.test.ts'), `test('x', () => { write(\`${sample}\`); });\n`);
    writeFileSync(join(root, 'src', 'cli.spec.mjs'), sample);
    writeFileSync(join(root, 'src', '__tests__', 'more.ts'), sample);
    writeFileSync(join(root, 'test', 'helper.ts'), sample);
    writeFileSync(join(root, 'tests', 'fixtures', 'app', 'src', 'cli.ts'), sample);

    scanCommand(root);
    const ids = loadRegistry(workspaceAt(root))!.features.map((item) => item.id).sort();
    equal(ids.join(','), 'cmd-real');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('default includes cover root entry files, workspaces, web/, and +page.svelte-only routes', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-layouts-'));
  try {
    // No root package.json: the app lives in web/, a tool in packages/, an entry script at the root.
    const routes = join(root, 'web', 'src', 'routes');
    mkdirSync(join(routes, 'about'), { recursive: true });
    mkdirSync(join(routes, 'blog'), { recursive: true });
    mkdirSync(join(routes, 'api', 'items'), { recursive: true });
    mkdirSync(join(routes, '(marketing)', 'pricing'), { recursive: true });
    mkdirSync(join(root, 'web', 'src', 'lib'), { recursive: true });
    mkdirSync(join(root, 'packages', 'tool', 'src'), { recursive: true });
    mkdirSync(join(root, 'apps', 'site', 'node_modules', 'dep'), { recursive: true });
    writeFileSync(join(root, 'web', 'package.json'), JSON.stringify({ name: 'web', private: true }));
    writeFileSync(join(routes, '+page.svelte'), '<h1>Home</h1>\n');
    writeFileSync(join(routes, 'about', '+page.svelte'), '<h1>About</h1>\n');
    writeFileSync(join(routes, 'blog', '+page.svelte'), '<h1>Blog</h1>\n');
    writeFileSync(join(routes, 'blog', '+page.server.ts'), 'export const load = () => ({});\n');
    writeFileSync(join(routes, 'api', 'items', '+server.ts'), 'export const GET = () => new Response();\n');
    writeFileSync(join(routes, '(marketing)', 'pricing', '+page.svelte'), '<h1>Pricing</h1>\n');
    writeFileSync(join(root, 'web', 'src', 'lib', 'Card.svelte'), '<div>card</div>\n');
    writeFileSync(join(root, 'packages', 'tool', 'package.json'), JSON.stringify({ name: 'tool' }));
    writeFileSync(join(root, 'packages', 'tool', 'src', 'cli.ts'), "const cmd = process.argv[2];\nif (cmd === 'build') {}\n");
    writeFileSync(join(root, 'apps', 'site', 'node_modules', 'dep', 'cli.js'), "const cmd = process.argv[2];\nif (cmd === 'vendored') {}\n");
    writeFileSync(join(root, 'run.mjs'), "const cmd = process.argv[2];\nif (cmd === 'sync') {}\n");

    scanCommand(root);
    const ids = loadRegistry(workspaceAt(root))!.features.map((item) => item.id).sort();
    // /api/items groups under its leaf; /blog appears once although it has +page.svelte and +page.server.ts.
    equal(ids.join(','), 'cmd-build,cmd-sync,route-about,route-blog,route-home,route-items,route-pricing');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
