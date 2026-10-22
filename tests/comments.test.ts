import { deepEqual, equal } from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { blankComments } from '../src/adapters/surface-ts.ts';
import { scanCommand } from '../src/commands/scan.ts';
import { loadRegistry, workspaceAt } from '../src/workspace.ts';

// Assembled at runtime so this test file never reads as an annotation itself.
const tag = ['feature', 'facts'].join('');

const cli = `import express from 'express';
const app = express();
const cmd = process.argv[2];
// if (cmd === 'ghost') ghost();
/**
 * Older routes: app.get('/hidden', handler) and program.command('legacy').
 */
/* app.post('/also-hidden', handler); */
switch (cmd) {
  // case 'commented':
  /** case 'phantom': */
  case 'run':
    run();
    break;
}
const home = 'http://example.com'; if (cmd === 'after-url') afterUrl();
const re = /https?:\\/\\//; if (cmd === 'after-regex') afterRegex();
const QUOTE = /['"\`]/g; // cmd === 'quoted-ghost'
const half = 4 / 2 / 1; if (cmd === 'after-division') afterDivision();
app.get('/live', () => undefined);
`;

test('commands and routes inside comments are not candidates; code after a URL or regex still counts', () => {
  const root = mkdtempSync(join(tmpdir(), 'ff-comments-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src', 'cli.ts'), cli);
    // Annotations are comments by design and keep working.
    writeFileSync(join(root, 'src', 'billing.ts'), `// ${tag}: billing\nexport const bill = 1;\n`);
    scanCommand(root);
    const ids = loadRegistry(workspaceAt(root))!.features.map((item) => item.id).sort();
    deepEqual(ids, ['billing', 'cmd-after-division', 'cmd-after-regex', 'cmd-after-url', 'cmd-run', 'route-live']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('blanking comments keeps offsets, newlines, and string contents', () => {
  const text = "a('//not') // gone\r\nb /* x\n y */ c";
  const out = blankComments(text);
  equal(out.length, text.length);
  equal(out, "a('//not')        \r\nb     \n      c");
  const regex = "x = /['/]/; // gone";
  equal(blankComments(regex), "x = /    /;        ");
});
