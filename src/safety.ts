import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { minimatch } from 'minimatch';
import type { Config, Exclusion, FileRecord, ScanContext } from './types.ts';
import { sha256Bytes } from './hash.ts';
import { toPosixRel } from './paths.ts';

const SECRET_NAMES = new Set(['.env', '.env.local', '.env.production', '.env.development']);
const SECRET_SUFFIXES = ['.pem', '.key', '.p12', '.pfx'];
const SELF_OUTPUTS = new Set(['FEATURE_FACTS.md', 'FEATURES.md']);

export function isExcluded(rel: string, patterns: string[]): boolean {
  return patterns.some((pattern) => minimatch(rel, pattern, { dot: true, nocomment: true }));
}

export function isIncluded(rel: string, patterns: string[]): boolean {
  return patterns.some((pattern) => minimatch(rel, pattern, { dot: true, nocomment: true }));
}

export function isSelfOutput(rel: string): boolean {
  const base = rel.split('/').pop() ?? rel;
  return rel.startsWith('.featurefacts/') || SELF_OUTPUTS.has(base);
}

export function enumerateTree(root: string, config: Config): ScanContext {
  const files: FileRecord[] = [];
  const exclusions: Exclusion[] = [];
  const contents = new Map<string, { bytes: Buffer; text: string }>();

  function walk(absDir: string): void {
    let entries;
    try {
      entries = readdirSync(absDir, { withFileTypes: true });
    } catch (error) {
      exclusions.push({
        path: toPosixRel(root, absDir) || '.',
        reason: `unreadable-directory: ${error instanceof Error ? error.message : String(error)}`,
      });
      return;
    }
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sorted) {
      const abs = join(absDir, entry.name);
      const rel = toPosixRel(root, abs);
      if (!rel) continue;
      let stat;
      try {
        stat = lstatSync(abs);
      } catch {
        exclusions.push({ path: rel, reason: 'unreadable' });
        continue;
      }
      if (stat.isSymbolicLink()) {
        exclusions.push({ path: rel, reason: 'symlink-skipped' });
        continue;
      }
      if (stat.isDirectory()) {
        if (isExcluded(rel, config.exclude) || isExcluded(`${rel}/**`, config.exclude)) {
          exclusions.push({ path: rel, reason: 'exclude-pattern' });
          continue;
        }
        walk(abs);
        continue;
      }
      if (!stat.isFile()) {
        exclusions.push({ path: rel, reason: 'non-file' });
        continue;
      }
      if (isExcluded(rel, config.exclude) || SECRET_NAMES.has(entry.name) || SECRET_SUFFIXES.some((s) => entry.name.endsWith(s))) {
        exclusions.push({ path: rel, reason: SECRET_NAMES.has(entry.name) || SECRET_SUFFIXES.some((s) => entry.name.endsWith(s)) ? 'secret-or-key' : 'exclude-pattern' });
        continue;
      }
      if (!isIncluded(rel, config.include)) continue;
      if (stat.size > config.safety.max_file_bytes) {
        exclusions.push({ path: rel, reason: 'oversized' });
        continue;
      }
      const bytes = readFileSync(abs);
      const hash = sha256Bytes(bytes);
      files.push({
        path: rel,
        sha256: hash,
        bytes: bytes.byteLength,
        eligible_adapter_ids: [],
        inspected_by: [],
      });
      contents.set(rel, { bytes, text: bytes.toString('utf8') });
    }
  }

  walk(root);
  files.sort((a, b) => a.path.localeCompare(b.path));
  exclusions.sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason));
  return { root, config, files, exclusions, contents };
}

export function markEligible(files: FileRecord[], adapterId: string, pred: (path: string) => boolean): string[] {
  const eligible: string[] = [];
  for (const file of files) {
    if (pred(file.path)) {
      if (!file.eligible_adapter_ids.includes(adapterId)) file.eligible_adapter_ids.push(adapterId);
      eligible.push(file.path);
    }
  }
  eligible.sort((a, b) => a.localeCompare(b));
  return eligible;
}

export function markInspected(files: FileRecord[], adapterId: string, paths: string[]): void {
  const set = new Set(paths);
  for (const file of files) {
    if (set.has(file.path) && !file.inspected_by.includes(adapterId)) {
      file.inspected_by.push(adapterId);
    }
  }
}
