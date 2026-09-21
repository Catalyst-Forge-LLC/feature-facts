import { ADAPTERS } from '../version.ts';
import { kebabId } from '../hash.ts';
import { markEligible, markInspected } from '../safety.ts';
import type { AdapterMeta, ScanContext, Surface } from '../types.ts';
import { findAnnotations } from './annotations.ts';

const TS_EXT = /\.(ts|tsx|js|mjs|cjs)$/;
const ROUTE_FILE = /(?:^|\/)(?:route|server|\+server|\+page(?:\.server)?)\.(ts|js)$/;
const ROUTE_CALL = /\.(get|post|put|patch|delete|options|head)\(\s*['"`]([^'"`]+)['"`]/g;
const COMMAND_CALL = /\.command\(\s*['"`]([^'"`]+)['"`]/g;

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

export function runSurface(ctx: ScanContext): SurfaceResult {
  const eligible = markEligible(ctx.files, ADAPTERS.surface.id, (path) => {
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
      add({
        id: kebabId(`file-${path.replace(/\.[^.]+$/, '')}`),
        kind: 'route',
        ref: path,
        title: path,
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

    for (const annotation of findAnnotations(content.text)) {
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
