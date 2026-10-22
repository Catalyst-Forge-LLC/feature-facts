import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { defaultConfig } from '../defaults.ts';
import { isExcluded, isIncluded } from '../safety.ts';
import type { Config } from '../types.ts';
import { loadYaml } from '../yaml-io.ts';
import { workspaceAt, writeYaml } from '../workspace.ts';

export interface RefreshConfigResult {
  /** Include patterns that are new to this config, in the order they would be appended. */
  added: string[];
  /** Exclude patterns that keep root tool configs (vite.config.ts and the like) out of a root glob. */
  excluded: string[];
  written: boolean;
}

/** Root tool and build configs. A root `*.ts` glob is for entry files, not these. */
export const ROOT_CONFIG_EXCLUDES = ['*.config.js', '*.config.mjs', '*.config.cjs', '*.config.ts', '*.config.mts', '*.config.cts', '.eslintrc.*'];
const ROOT_CONFIG = /^(?:[^/]+\.config\.[cm]?[jt]s|\.eslintrc\..+)$/;
const CODE = /\.(?:[cm]?[jt]sx?|svelte|vue)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', 'vendor', 'tmp']);
const ROOT_GLOB = /^\*\.[a-z]+$/;

function entries(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

const DOC = /\.mdx?$/;

/** True when a folder holds source code (or, for docs, Markdown), looking a few levels down and skipping build output. */
function hasCode(dir: string, kind: RegExp = CODE, depth = 4): boolean {
  for (const name of entries(dir)) {
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (isDir(path)) {
      if (depth > 0 && hasCode(path, kind, depth - 1)) return true;
    } else if (kind.test(name) && !/\.d\.ts$/.test(name)) {
      return true;
    }
  }
  return false;
}

function dirExcluded(name: string, exclude: string[]): boolean {
  return isExcluded(`${name}/`, exclude) || isExcluded(`${name}/x.ts`, exclude);
}

/** A top-level folder that is its own app: it has a package.json or a src/ folder, and code. */
function isAppFolder(root: string, name: string): boolean {
  const dir = join(root, name);
  return (existsSync(join(dir, 'package.json')) || isDir(join(dir, 'src'))) && hasCode(dir);
}

/** Whether a default include pattern would cover anything in this repo. */
function patternApplies(root: string, pattern: string, exclude: string[]): boolean {
  const dir = pattern.match(/^([^*/]+)\/\*\*$/)?.[1];
  if (dir) return !dirExcluded(dir, exclude) && hasCode(join(root, dir), dir === 'docs' ? DOC : CODE);
  if (ROOT_GLOB.test(pattern)) {
    // Only a root entry script, never a root tool config, earns a root glob.
    return entries(root).some((name) => isIncluded(name, [pattern]) && !ROOT_CONFIG.test(name) && !isExcluded(name, exclude) && !isDir(join(root, name)));
  }
  return existsSync(join(root, pattern));
}

/**
 * Add include patterns to an existing `.featurefacts/config.yaml`. By default these are the
 * defaults the config is missing that match something in the repo, plus any top-level app folder
 * (such as `ui/` or `viewer/`) that has its own package.json or src/ and code; `patterns` names
 * specific ones instead. When a root glob is included and the repo has root tool configs, their
 * exclude patterns are added too. Selections, approvals, adapters, and every other setting are
 * kept. Nothing is written unless `write` is set.
 */
export function refreshConfigCommand(root: string, options: { write?: boolean; patterns?: string[] } = {}): RefreshConfigResult {
  const ws = workspaceAt(root);
  if (!existsSync(ws.configPath)) {
    throw new Error('No .featurefacts/config.yaml found. Run featurefacts init or scan first.');
  }
  const config = loadYaml<Config>(ws.configPath);
  const include = Array.isArray(config.include) ? config.include : [];
  const exclude = Array.isArray(config.exclude) ? config.exclude : [];
  let wanted: string[];
  if (options.patterns?.length) {
    wanted = options.patterns;
  } else {
    const defaults = defaultConfig().include.filter((pattern) => patternApplies(root, pattern, exclude));
    const apps = entries(root)
      .filter((name) => !name.startsWith('.') && !SKIP_DIRS.has(name) && isDir(join(root, name)))
      .filter((name) => !isIncluded(`${name}/x.ts`, [...include, ...defaults]) && !dirExcluded(name, exclude))
      .filter((name) => isAppFolder(root, name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `${name}/**`);
    wanted = [...defaults, ...apps];
  }
  const added = [...new Set(wanted)].filter((pattern) => !include.includes(pattern));
  const nextInclude = [...include, ...added];
  const rootConfigs = entries(root).filter((name) => ROOT_CONFIG.test(name) && isIncluded(name, nextInclude));
  const excluded = rootConfigs.length ? ROOT_CONFIG_EXCLUDES.filter((pattern) => !exclude.includes(pattern)) : [];
  if (!options.write || (!added.length && !excluded.length)) return { added, excluded, written: false };
  config.include = nextInclude;
  config.exclude = [...exclude, ...excluded];
  return { added, excluded, written: writeYaml(ws.configPath, config) };
}
