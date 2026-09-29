/**
 * Product spelling for a label heading.
 * Keep in step with app-facts/generator/product_title.js.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const FAMILY: Record<string, string> = {
  'app-facts': 'AppFacts',
  'agent-facts': 'AgentFacts',
  'feature-facts': 'FeatureFacts',
  'model-facts': 'ModelFacts',
  'skill-facts': 'SkillFacts',
  'tool-facts': 'ToolFacts',
  'x-facts': 'xFacts',
};

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'examples']);

function foldName(value: string): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sameProduct(current: string, title: string): boolean {
  const left = foldName(current);
  const right = foldName(title);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.endsWith('workspace') && left.slice(0, -'workspace'.length) === right) return true;
  if (left.startsWith('get') && left.slice(3) === right) return true;
  return false;
}

function walkConfigs(dir: string, depth: number, out: string[]): void {
  if (depth > 3) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkConfigs(full, depth + 1, out);
    else if (/^filepress\.config\./.test(entry.name)) out.push(full);
  }
}

function configTitle(file: string): string {
  const raw = readFileSync(file, 'utf8');
  const match = raw.match(/^\s*title:\s*['"]([^'"]+)['"]/m);
  return match ? match[1].trim() : '';
}

export function productTitle(root: string): string {
  const configs: string[] = [];
  walkConfigs(root, 0, configs);
  const titles = configs
    .map((file) => ({ file: file.replaceAll('\\', '/'), title: configTitle(file) }))
    .filter((item) => item.title);
  const preferred = titles.find((item) => /\/site\/filepress\.config\./.test(item.file))
    || titles.find((item) => !/\/sites\/demo\//.test(item.file))
    || titles[0];
  if (preferred?.title) return preferred.title;
  const family = FAMILY[basename(root)];
  if (family) return family;
  const readme = join(root, 'README.md');
  if (!existsSync(readme)) return '';
  const line = readFileSync(readme, 'utf8').split(/\r?\n/).find((item) => item.startsWith('# '));
  const heading = line ? line.slice(2).trim() : '';
  if (/^[A-Za-z0-9][A-Za-z0-9 .'+-]{0,40}$/.test(heading) && !heading.includes(' - ')) return heading;
  return '';
}

export function preferProductTitle(current: string, title: string): string {
  const name = String(current || '').trim();
  if (!title) return name;
  return title;
}

export { sameProduct };
