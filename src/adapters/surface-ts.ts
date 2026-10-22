import { ADAPTERS } from '../version.ts';
import { kebabId } from '../hash.ts';
import { markEligible, markInspected } from '../safety.ts';
import type { AdapterMeta, ScanContext, Surface } from '../types.ts';
import { findAnnotations } from './annotations.ts';

const TS_EXT = /\.(ts|tsx|js|mjs|cjs)$/;
/** Test code and fixtures describe other programs; their commands and routes are not this product's. */
const TEST_DIR = /(?:^|\/)(?:tests?|__tests__|__mocks__|fixtures?|e2e)\//;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

export function isTestPath(path: string): boolean {
  return TEST_DIR.test(path) || TEST_FILE.test(path);
}
const ROUTE_FILE = /(?:^|\/)(?:route|server|\+server|\+page(?:\.server)?)\.(ts|js)$/;
const ROUTE_CALL = /\.(get|post|put|patch|delete|options|head)\(\s*['"`](\/[^'"`]*)['"`]/g;
const COMMAND_CALL = /\.command\(\s*['"`]([^'"`]+)['"`]/g;
const ARGV_EQ = /\b(?:cmd|command|subcommand)\s*==+\s*['"`]([a-z][a-z0-9-]*)['"`]/g;
const ARGV_CASE = /\bcase\s+['"`]([a-z][a-z0-9-]*)['"`]\s*:/g;
const SWITCH_START = /\bswitch\s*\(/g;
/** A switch on one of these reads a subcommand; `switch (method)` in a JSON-RPC handler does not. */
const ARGV_NAMES = /^(?:cmd|command|subcommand|sub|verb)$/;
const ARGV_EXPR = /\bargv\b|\bargs?\s*\[\s*0\s*\]|\bpositionals?\s*\[\s*0\s*\]/;

export function isArgvDiscriminant(expr: string): boolean {
  const text = expr.trim();
  return ARGV_NAMES.test(text) || ARGV_EXPR.test(text);
}

/** Skip a string or template literal that starts at `start`; returns the index after it. */
function skipQuoted(text: string, start: number): number {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length && text[i] !== quote) {
    if (text[i] === '\\') i += 1;
    i += 1;
  }
  return i + 1;
}

/** Skip a // or block comment that starts at `start`; returns `start` when there is none. */
function skipComment(text: string, start: number): number {
  if (text[start] !== '/') return start;
  if (text[start + 1] === '/') {
    const end = text.indexOf('\n', start);
    return end < 0 ? text.length : end;
  }
  if (text[start + 1] === '*') {
    const end = text.indexOf('*/', start + 2);
    return end < 0 ? text.length : end + 2;
  }
  return start;
}

/** Index just past the bracket that closes the one at `open`, or -1. */
function matchBracket(text: string, open: number): number {
  const opener = text[open];
  const closer = opener === '(' ? ')' : '}';
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipQuoted(text, i);
      continue;
    }
    const past = skipComment(text, i);
    if (past !== i) {
      i = past;
      continue;
    }
    if (ch === opener) depth += 1;
    if (ch === closer) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
}

/** `case 'x':` labels of switches whose discriminant reads argv, with their offsets. */
export function argvCaseLabels(text: string): Array<{ name: string; index: number }> {
  const out: Array<{ name: string; index: number }> = [];
  SWITCH_START.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SWITCH_START.exec(text))) {
    const parenOpen = match.index + match[0].length - 1;
    const parenClose = matchBracket(text, parenOpen);
    if (parenClose < 0) continue;
    if (!isArgvDiscriminant(text.slice(parenOpen + 1, parenClose - 1))) continue;
    const braceOpen = text.indexOf('{', parenClose);
    if (braceOpen < 0) continue;
    const braceClose = matchBracket(text, braceOpen);
    if (braceClose < 0) continue;
    // Only labels at this switch's own depth; a nested switch is judged on its own.
    let depth = 0;
    let i = braceOpen + 1;
    while (i < braceClose - 1) {
      const ch = text[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        i = skipQuoted(text, i);
        continue;
      }
      const past = skipComment(text, i);
      if (past !== i) {
        i = past;
        continue;
      }
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (depth === 0 && ch === 'c') {
        ARGV_CASE.lastIndex = i;
        const label = ARGV_CASE.exec(text);
        if (label && label.index === i) out.push({ name: label[1]!, index: i });
      }
      i += 1;
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

export interface SurfaceResult {
  adapter: AdapterMeta;
  surfaces: Surface[];
  ecosystemSupported: boolean;
}

function provenance(method: string) {
  return {
    adapter_id: ADAPTERS.surface.id,
    adapter_version: ADAPTERS.surface.version,
    origin: 'deterministic' as const,
    method,
  };
}

function routeTitle(ref: string): string {
  if (ref === '/') return 'Home';
  const leaf = ref.split('/').filter(Boolean).pop() ?? 'Route';
  return leaf
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** SvelteKit `routes` files become URL paths. Other `route.ts` files stay file surfaces. */
function svelteRoute(path: string): { id: string; ref: string; title: string } | null {
  const norm = path.replace(/\\/g, '/');
  const at = norm.indexOf('/routes/');
  if (at < 0 && !norm.startsWith('routes/')) return null;
  const rest = at >= 0 ? norm.slice(at + '/routes/'.length) : norm.slice('routes/'.length);
  if (!/\+(?:server|page)(?:\.server)?\.(?:ts|js)$/.test(rest)) return null;
  const route = rest
    .replace(/\/?\+(?:server|page)(?:\.server)?\.(?:ts|js)$/, '')
    .replace(/(^|\/)\([^/]+\)(?=\/|$)/g, '$1')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
  const ref = route ? `/${route}` : '/';
  return { id: route ? kebabId(`route-${route}`) : 'route-home', ref, title: routeTitle(ref) };
}

export function runSurface(ctx: ScanContext): SurfaceResult {
  const eligible = markEligible(ctx.files, ADAPTERS.surface.id, (path) => {
    if (isTestPath(path)) return false;
    return path === 'package.json' || TS_EXT.test(path);
  });

  const hasPackage = ctx.files.some((f) => f.path === 'package.json');
  const hasTs = eligible.some((path) => path !== 'package.json');
  if (!hasPackage && !hasTs) {
    return {
      adapter: {
        id: ADAPTERS.surface.id,
        version: ADAPTERS.surface.version,
        kind: 'surface',
        state: 'unsupported',
        eligible_files: eligible,
        inspected_files: [],
        diagnostics: [
          {
            code: 'unsupported-ecosystem',
            severity: 'warning',
            message: 'No package.json or TypeScript/JavaScript sources were eligible. First adapter supports TypeScript/Node only.',
          },
        ],
      },
      surfaces: [],
      ecosystemSupported: false,
    };
  }

  const surfaces: Surface[] = [];
  const used = new Set<string>();

  function add(surface: Surface): void {
    if (used.has(surface.id)) {
      surface.id = kebabId(`${surface.id}-${surface.locator.path.replace(/[^a-z0-9]+/g, '-')}`);
    }
    used.add(surface.id);
    surfaces.push(surface);
  }

  for (const path of eligible) {
    const file = ctx.files.find((f) => f.path === path);
    const content = ctx.contents.get(path);
    if (!file || !content) continue;

    if (path === 'package.json') {
      try {
        const pkg = JSON.parse(content.text) as {
          name?: string;
          bin?: string | Record<string, string>;
          scripts?: Record<string, string>;
        };
        if (pkg.bin) {
          const bins = typeof pkg.bin === 'string' ? { [pkg.name ?? 'cli']: pkg.bin } : pkg.bin;
          for (const [name, target] of Object.entries(bins).sort(([a], [b]) => a.localeCompare(b))) {
            add({
              id: kebabId(`cmd-${name}`),
              kind: 'command',
              ref: `bin ${name}`,
              title: name,
              locator: { path, content_sha256: file.sha256, symbol: `bin.${name}` },
              provenance: provenance('package-json-bin'),
              state: 'current',
            });
            void target;
          }
        }
      } catch {
        // Treat as data. A broken package.json is a diagnostic, not execution.
      }
    }

    if (ROUTE_FILE.test(path)) {
      const svelte = svelteRoute(path);
      add({
        id: svelte?.id ?? kebabId(`file-${path.replace(/\.[^.]+$/, '')}`),
        kind: 'route',
        ref: svelte?.ref ?? path,
        title: svelte?.title ?? path,
        locator: { path, content_sha256: file.sha256 },
        provenance: provenance('framework-route-file'),
        state: 'current',
      });
    }

    ROUTE_CALL.lastIndex = 0;
    let match: RegExpExecArray | null;
    const lines = content.text.split(/\r?\n/);
    while ((match = ROUTE_CALL.exec(content.text))) {
      const method = match[1].toUpperCase();
      const route = match[2];
      const start = content.text.slice(0, match.index).split(/\r?\n/).length;
      add({
        id: kebabId(`route-${method}-${route}`),
        kind: 'route',
        ref: `${method} ${route}`,
        title: `${method} ${route}`,
        locator: { path, content_sha256: file.sha256, start_line: start, end_line: start, symbol: `${method} ${route}` },
        provenance: provenance('static-route-call'),
        state: 'current',
      });
    }

    COMMAND_CALL.lastIndex = 0;
    while ((match = COMMAND_CALL.exec(content.text))) {
      const name = match[1].split(/[\s<[]/)[0];
      const start = content.text.slice(0, match.index).split(/\r?\n/).length;
      add({
        id: kebabId(`cmd-${name}`),
        kind: 'command',
        ref: name,
        title: name,
        locator: { path, content_sha256: file.sha256, start_line: start, end_line: start, symbol: name },
        provenance: provenance('static-command-call'),
        state: 'current',
      });
    }

    if (content.text.includes('process.argv')) {
      const seenCmd = new Set<string>();
      const hits: Array<{ name: string; index: number }> = [];
      ARGV_EQ.lastIndex = 0;
      while ((match = ARGV_EQ.exec(content.text))) hits.push({ name: match[1]!, index: match.index });
      hits.push(...argvCaseLabels(content.text));
      for (const hit of hits) {
        const name = hit.name;
        if (seenCmd.has(name)) continue;
        seenCmd.add(name);
        const start = content.text.slice(0, hit.index).split(/\r?\n/).length;
        add({
          id: kebabId(`cmd-${name}`),
          kind: 'command',
          ref: name,
          title: name,
          locator: { path, content_sha256: file.sha256, start_line: start, end_line: start, symbol: name },
          provenance: provenance('argv-command'),
          state: 'current',
        });
      }
    }

    // package.json is data: a description such as "FeatureFacts: a compact ..." is prose, not an annotation.
    for (const annotation of path.endsWith('package.json') ? [] : findAnnotations(content.text)) {
      add({
        id: kebabId(`ann-${annotation.id}-${path}`),
        kind: 'other',
        ref: annotation.id,
        title: annotation.id,
        locator: { path, content_sha256: file.sha256, start_line: annotation.line, end_line: annotation.line },
        provenance: provenance('explicit-annotation'),
        state: 'current',
      });
    }

    void lines;
  }

  markInspected(ctx.files, ADAPTERS.surface.id, eligible);
  surfaces.sort((a, b) => a.id.localeCompare(b.id) || a.ref.localeCompare(b.ref));
  return {
    adapter: {
      id: ADAPTERS.surface.id,
      version: ADAPTERS.surface.version,
      kind: 'surface',
      state: 'completed',
      eligible_files: eligible,
      inspected_files: eligible,
      diagnostics: [],
    },
    surfaces,
    ecosystemSupported: true,
  };
}
