import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';

export function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

export function writeIfChanged(path: string, text: string): boolean {
  const next = text.endsWith('\n') ? text : `${text}\n`;
  if (existsSync(path) && readFileSync(path, 'utf8') === next) return false;
  writeText(path, next);
  return true;
}

export function parseYaml<T>(text: string, label: string): T {
  const doc = parse(text, { merge: false, uniqueKeys: true, maxAliasCount: 0 });
  if (doc === null || typeof doc !== 'object') {
    throw new Error(`${label} must be a YAML object`);
  }
  return doc as T;
}

export function loadYaml<T>(path: string): T {
  return parseYaml<T>(readText(path), path);
}

export function dumpYaml(value: unknown): string {
  return stringify(value, {
    lineWidth: 0,
    aliasDuplicateObjects: false,
  });
}

export function parseFrontmatter(markdown: string): { data: Record<string, unknown>; body: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Label is missing YAML frontmatter');
  return { data: parseYaml(match[1], 'frontmatter'), body: match[2] };
}

export function renderFrontmatter(data: Record<string, unknown>, body: string): string {
  return `---\n${dumpYaml(data).trimEnd()}\n---\n\n${body.replace(/^\n+/, '')}`;
}
