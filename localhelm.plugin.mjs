/**
 * FeatureFacts plugin for LocalHelm.
 * Cheap board over init / scan / check / report. Writes stay explicit.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverRepos, hasRegister, isRepo, rememberRepos, registeredRepos } from './scripts/helm-repos.mjs';

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

const ROW_ACTIONS = [
  { id: 'scan', label: 'Scan', write: true, icon: 'lucide:radar' },
  { id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' },
  { id: 'report', label: 'Report', write: true, icon: 'lucide:file-output' },
];

function repoById(id) {
  const hit = registeredRepos(root).find((row) => row.id === id);
  if (!hit) throw new Error(`No FeatureFacts register for ${id}. Init that repo from Add repos first.`);
  return hit;
}

async function board() {
  const rows = registeredRepos(root);
  return {
    plugin: 'featurefacts',
    title: 'FeatureFacts',
    rowLabel: 'repo',
    note: 'Add repos scans a folder for package.json or git checkouts that do not have a register yet. Init writes an empty FEATURE_FACTS.md and .featurefacts/ into each ticked repo. It does not scan code and does not replace an existing register. Scan, Check, and Report then run in that repo.',
    columns: [
      { id: 'label', label: 'label' },
      { id: 'register', label: 'folder' },
    ],
    rows: rows.map((row) => ({
      id: row.id,
      label: row.name,
      cells: { label: 'FEATURE_FACTS.md', register: row.path },
      actions: ROW_ACTIONS,
    })),
  };
}

async function plan(action, ids = []) {
  if (action === 'discover') {
    const scanRoot = ids[0] ? resolve(ids[0]) : resolve(root, '..');
    return { root: scanRoot.replace(/\\/g, '/'), candidates: discoverRepos(scanRoot) };
  }
  const command = action === 'scan' ? 'scan' : action === 'check' ? 'check' : action === 'report' ? 'report' : null;
  if (!command) throw new Error(`Unknown FeatureFacts action: ${action}`);
  const targets = (ids.length ? ids : ['feature-facts']).map((id) => repoById(id));
  return {
    rows: targets.map((row) => ({
      id: row.id,
      action: command,
      writes: true,
      reason: `featurefacts ${command} --root ${row.absPath}`,
    })),
  };
}

async function apply(action, ids = []) {
  if (action === 'init') {
    const added = [];
    const already = [];
    const skipped = [];
    for (const raw of ids) {
      const dir = resolve(raw);
      const name = dir.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? dir;
      if (!isRepo(dir)) {
        skipped.push(`${name}: not a repo (need package.json or .git)`);
        continue;
      }
      if (hasRegister(dir)) {
        already.push(name);
        continue;
      }
      const result = await run(['init', '--root', dir]);
      if (result.status !== 0) {
        const detail = result.stderr.trim() || result.stdout.trim() || `featurefacts init failed (exit ${result.status})`;
        throw new Error(`${name}: ${detail}`);
      }
      added.push(dir.replace(/\\/g, '/'));
    }
    if (added.length) rememberRepos(root, added);
    if (!added.length) {
      const why = [...already.map((name) => `${name}: already has a register`), ...skipped];
      throw new Error(why.join(' · ') || 'Nothing to init.');
    }
    return { ok: true, added, already, skipped };
  }
  const command = action === 'scan' ? 'scan' : action === 'check' ? 'check' : action === 'report' ? 'report' : null;
  if (!command) throw new Error(`Unknown FeatureFacts action: ${action}`);
  const targets = (ids.length ? ids : ['feature-facts']).map((id) => repoById(id));
  const results = [];
  for (const row of targets) {
    const result = await run([command, '--root', row.absPath]);
    const detail = result.stdout.trim() || result.stderr.trim();
    results.push({ id: row.id, ok: result.status === 0, detail });
  }
  const failed = results.filter((row) => !row.ok);
  return {
    ok: failed.length === 0,
    results,
    log: failed.map((row) => row.detail).filter(Boolean),
  };
}

const plugin = {
  id: 'featurefacts',
  label: 'FeatureFacts',
  board,
  plan,
  apply,
};

export default plugin;
