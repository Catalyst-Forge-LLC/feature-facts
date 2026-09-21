/**
 * FeatureFacts plugin for LocalHelm.
 * Cheap board over init / scan / check / report. Writes stay explicit.
 */
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'src/cli.ts', ...args], {
      cwd: root,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      if (status !== 0 && !stdout) {
        reject(new Error(stderr || `featurefacts failed (exit ${status})`));
        return;
      }
      resolve({ status, stdout, stderr });
    });
  });
}

async function board() {
  return {
    plugin: 'featurefacts',
    title: 'FeatureFacts',
    columns: [
      { id: 'label', label: 'label' },
      { id: 'register', label: 'register' },
    ],
    rows: [
      {
        id: 'feature-facts',
        label: 'FeatureFacts',
        cells: { label: 'FEATURE_FACTS.md', register: '.featurefacts/' },
        actions: [
          { id: 'scan', label: 'Scan', write: true, icon: 'lucide:radar' },
          { id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' },
          { id: 'report', label: 'Report', write: true, icon: 'lucide:file-output' },
        ],
      },
    ],
  };
}

async function plan(action) {
  if (action === 'scan') return { summary: 'Run featurefacts scan in this checkout.' };
  if (action === 'check') return { summary: 'Run featurefacts check (read-only).' };
  if (action === 'report') return { summary: 'Regenerate projections without rescanning.' };
  throw new Error(`Unknown FeatureFacts action: ${action}`);
}

async function apply(action) {
  const command = action === 'scan' ? ['scan'] : action === 'check' ? ['check'] : action === 'report' ? ['report'] : null;
  if (!command) throw new Error(`Unknown FeatureFacts action: ${action}`);
  const result = await run(command);
  return { ok: result.status === 0, detail: result.stdout.trim() || result.stderr.trim() };
}

const plugin = {
  id: 'featurefacts',
  label: 'FeatureFacts',
  board,
  plan,
  apply,
};

export default plugin;
