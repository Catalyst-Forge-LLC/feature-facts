import { ADAPTERS } from '../version.ts';
import { kebabId } from '../hash.ts';
import { isSelfOutput, markEligible, markInspected } from '../safety.ts';
import type { AdapterMeta, ScanContext, Surface } from '../types.ts';
import { findAnnotations } from './annotations.ts';

const DOC_EXT = /\.(md|mdx|txt)$/;

export function runDocument(ctx: ScanContext): { adapter: AdapterMeta; surfaces: Surface[] } {
  const eligible = markEligible(ctx.files, ADAPTERS.document.id, (path) => {
    return DOC_EXT.test(path) && !isSelfOutput(path);
  });

  const surfaces: Surface[] = [];
  for (const path of eligible) {
    const file = ctx.files.find((f) => f.path === path);
    const content = ctx.contents.get(path);
    if (!file || !content) continue;
    const annotations = findAnnotations(content.text);
    if (annotations.length === 0) {
      surfaces.push({
        id: kebabId(`doc-${path.replace(/\.[^.]+$/, '')}`),
        kind: 'document',
        ref: path,
        title: path,
        locator: { path, content_sha256: file.sha256 },
        provenance: {
          adapter_id: ADAPTERS.document.id,
          adapter_version: ADAPTERS.document.version,
          origin: 'deterministic',
          method: 'document-file',
        },
        state: 'current',
      });
      continue;
    }
    for (const annotation of annotations) {
      surfaces.push({
        id: kebabId(`doc-${annotation.id}`),
        kind: 'document',
        ref: annotation.id,
        title: path,
        locator: { path, content_sha256: file.sha256, start_line: annotation.line, end_line: annotation.line },
        provenance: {
          adapter_id: ADAPTERS.document.id,
          adapter_version: ADAPTERS.document.version,
          origin: 'deterministic',
          method: 'explicit-annotation',
        },
        state: 'current',
      });
    }
  }

  markInspected(ctx.files, ADAPTERS.document.id, eligible);
  surfaces.sort((a, b) => a.id.localeCompare(b.id));
  return {
    adapter: {
      id: ADAPTERS.document.id,
      version: ADAPTERS.document.version,
      kind: 'document',
      state: 'completed',
      eligible_files: eligible,
      inspected_files: eligible,
      diagnostics: [],
    },
    surfaces,
  };
}
