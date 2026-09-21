import { isAbsolute, posix, relative, resolve, sep } from 'node:path';

const FORBIDDEN = /[:\\]|\/\/|(?:^|\/)\.\.(?:\/|$)|(?:^|\/)\.(?:\/|$)|[\x00-\x1f]/;

export function toPosixRel(root: string, absPath: string): string {
  const rel = relative(root, absPath).split(sep).join('/');
  if (!rel || rel === '.') return '';
  return rel;
}

export function assertRelPath(path: string): string {
  if (path === '.') return path;
  if (isAbsolute(path) || FORBIDDEN.test(path) || path.startsWith('/')) {
    throw new Error(`Unsafe path: ${path}`);
  }
  return path;
}

export function resolveContained(root: string, rel: string): string {
  const safe = assertRelPath(rel);
  const abs = resolve(root, ...safe.split('/'));
  const relBack = relative(root, abs);
  if (relBack.startsWith('..') || isAbsolute(relBack)) {
    throw new Error(`Path escapes root: ${rel}`);
  }
  return abs;
}

export function posixJoin(...parts: string[]): string {
  return posix.join(...parts);
}
