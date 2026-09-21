import { ADAPTERS } from '../version.ts';
import { kebabId } from '../hash.ts';
import { markEligible, markInspected } from '../safety.ts';
import type { AdapterMeta, ScanContext, Surface } from '../types.ts';
import { findAnnotations } from './annotations.ts';

const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|mjs)$/;

export function runTests(ctx: ScanContext): { adapter: AdapterMeta; surfaces: Surface[] } {
  const eligible = markEligible(ctx.files, ADAPTERS.test.id, (path) => TEST_FILE.test(path));
  const surfaces: Surface[] = [];

  for (const path of eligible) {
    const file = ctx.files.find((f) => f.path === path);
    const content = ctx.contents.get(path);
    if (!file || !content) continue;
    const annotations = findAnnotations(content.text);
    surfaces.push({
      id: kebabId(`test-${path.replace(/\.[^.]+$/, '')}`),
      kind: 'test',
      ref: path,
      title: path,
      locator: { path, content_sha256: file.sha256 },
      provenance: {
        adapter_id: ADAPTERS.test.id,
        adapter_version: ADAPTERS.test.version,
        origin: 'deterministic',
        method: annotations.length ? 'explicit-annotation' : 'test-filename',
      },
      state: 'current',
    });
    for (const annotation of annotations) {
      surfaces.push({
        id: kebabId(`test-${annotation.id}`),
        kind: 'test',
        ref: annotation.id,
        title: path,
        locator: { path, content_sha256: file.sha256, start_line: annotation.line, end_line: annotation.line },
        provenance: {
          adapter_id: ADAPTERS.test.id,
          adapter_version: ADAPTERS.test.version,
          origin: 'deterministic',
          method: 'explicit-annotation',
        },
        state: 'current',
      });
    }
  }

  markInspected(ctx.files, ADAPTERS.test.id, eligible);
  surfaces.sort((a, b) => a.id.localeCompare(b.id));
  return {
    adapter: {
      id: ADAPTERS.test.id,
      version: ADAPTERS.test.version,
      kind: 'test',
      state: 'completed',
      eligible_files: eligible,
      inspected_files: eligible,
      diagnostics: [],
    },
    surfaces,
  };
}
