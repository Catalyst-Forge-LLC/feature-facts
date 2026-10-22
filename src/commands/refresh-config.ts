import { existsSync } from 'node:fs';
import { defaultConfig } from '../defaults.ts';
import type { Config } from '../types.ts';
import { loadYaml } from '../yaml-io.ts';
import { workspaceAt, writeYaml } from '../workspace.ts';

export interface RefreshConfigResult {
  /** Include patterns that are new to this config, in the order they would be appended. */
  added: string[];
  written: boolean;
}

/**
 * Add include patterns to an existing `.featurefacts/config.yaml`. By default these are the
 * defaults the config is missing; `patterns` names specific ones instead. Selections, approvals,
 * excludes, adapters, and every other setting are kept. Nothing is written unless `write` is set.
 */
export function refreshConfigCommand(root: string, options: { write?: boolean; patterns?: string[] } = {}): RefreshConfigResult {
  const ws = workspaceAt(root);
  if (!existsSync(ws.configPath)) {
    throw new Error('No .featurefacts/config.yaml found. Run featurefacts init or scan first.');
  }
  const config = loadYaml<Config>(ws.configPath);
  const include = Array.isArray(config.include) ? config.include : [];
  const wanted = options.patterns?.length ? options.patterns : defaultConfig().include;
  const added = [...new Set(wanted)].filter((pattern) => !include.includes(pattern));
  if (!options.write || !added.length) return { added, written: false };
  config.include = [...include, ...added];
  return { added, written: writeYaml(ws.configPath, config) };
}
