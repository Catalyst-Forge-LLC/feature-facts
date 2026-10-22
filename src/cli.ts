import { resolve } from 'node:path';
import { checkCommand } from './commands/check.ts';
import { initCommand } from './commands/init.ts';
import { reportCommand } from './commands/report.ts';
import { scanCommand } from './commands/scan.ts';
import { curateSelection, gitActor, reviewSnapshot } from './commands/curate.ts';
import { showCommand } from './commands/show.ts';
import { TOOL_NAME, TOOL_VERSION } from './version.ts';

function help(): string {
  return `${TOOL_NAME} ${TOOL_VERSION}

Know what a product can do, where the evidence lives, and which capabilities still need review.

Usage:
  featurefacts init [--root DIR]
  featurefacts scan [--root DIR]
  featurefacts report [--root DIR]
  featurefacts show [feature-id] [--root DIR]
  featurefacts review [--root DIR]
  featurefacts review --apply [--root DIR] [--actor NAME] [--source TEXT] [--id FEATURE]...
  featurefacts check [--projection] [--root DIR]

Default scan does not execute target code, use the network, or call a model.
Candidates are not confirmed features. Empty labels are valid.
`;
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function argValues(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== name) continue;
    const value = args[i + 1];
    if (!value || value.startsWith('--')) continue;
    out.push(value);
    i += 1;
  }
  return out;
}

export async function run(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  if (!command || command === '-h' || command === '--help') {
    process.stdout.write(help());
    return;
  }
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${TOOL_VERSION}\n`);
    return;
  }
  const root = resolve(argValue(rest, '--root') ?? process.cwd());
  try {
    if (command === 'init') {
      const result = initCommand(root);
      process.stdout.write(`Initialized FeatureFacts register.${result.changed.length ? ` Wrote ${result.changed.length} files.` : ''}\n`);
      return;
    }
    if (command === 'scan') {
      const result = scanCommand(root);
      process.stdout.write(`Scan ${result.scanId} ${result.status}. Changed ${result.changed.length} files.\n`);
      for (const item of result.diagnostics) process.stderr.write(`${item.severity}: ${item.message}\n`);
      if (result.status === 'failed') process.exitCode = 3;
      return;
    }
    if (command === 'report') {
      const result = reportCommand(root);
      process.stdout.write(`Report refreshed.${result.changed.length ? ` Wrote ${result.changed.length} files.` : ' No semantic changes.'}\n`);
      return;
    }
    if (command === 'show') {
      const id = rest.find((item) => !item.startsWith('--') && item !== argValue(rest, '--root'));
      process.stdout.write(showCommand(root, id));
      return;
    }
    if (command === 'review') {
      if (rest.includes('--apply')) {
        const ids = argValues(rest, '--id');
        const actor = argValue(rest, '--actor') ?? gitActor(root);
        const result = curateSelection(root, ids, actor, argValue(rest, '--source'));
        process.stdout.write(
          result.selected.length
            ? `Label updated with ${result.selected.length} capabilities.\n`
            : 'Label cleared. Nothing is selected.\n',
        );
        return;
      }
      process.stdout.write(`${JSON.stringify(reviewSnapshot(root))}\n`);
      return;
    }
    if (command === 'check') {
      const mode = rest.includes('--projection') ? 'projection' : 'full';
      const result = checkCommand(root, mode);
      for (const message of result.messages) process.stdout.write(`${message}\n`);
      process.exitCode = result.exit;
      return;
    }
    process.stderr.write(`Unknown command: ${command}\n${help()}`);
    process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 3;
  }
}

const entry = process.argv[1]?.replace(/\\/g, '/') ?? '';
if (entry.endsWith('src/cli.ts')) {
  await run(process.argv.slice(2));
}

