import { existsSync } from 'node:fs';
import { emptyRegistry } from '../defaults.ts';
import { defaultConfig } from '../defaults.ts';
import { buildManifest, productNameFromRoot } from '../project.ts';
import { enumerateTree } from '../safety.ts';
import type { AdapterMeta } from '../types.ts';
import { ADAPTERS } from '../version.ts';
import { writeGenerated } from '../write-artifacts.ts';
import { writeJson, workspaceAt } from '../workspace.ts';
import { localDate, localTimestamp } from '../time.ts';

export function initCommand(root: string): { changed: string[] } {
  const ws = workspaceAt(root);
  if (existsSync(ws.configPath) || existsSync(ws.featuresPath)) {
    // init would replace the selection and approval with defaults.
    throw new Error(
      'This repo already has a .featurefacts/ register. Run featurefacts scan, or featurefacts refresh-config to add new default include patterns.',
    );
  }
  const config = defaultConfig();
  const registry = emptyRegistry('scan-init', productNameFromRoot(root));
  const result = writeGenerated({
    ws,
    config,
    registry,
    surfaces: [],
    date: localDate(),
    writeConfig: true,
  });
  // The manifest records the scope from the start, so the first commit already has what check reads.
  // No adapter ran, so each is recorded as skipped and the status is partial.
  const ctx = enumerateTree(root, config);
  const adapters: AdapterMeta[] = Object.values(ADAPTERS).map((adapter) => ({
    id: adapter.id,
    version: adapter.version,
    kind: adapter.kind,
    state: 'skipped',
    eligible_files: [],
    inspected_files: [],
    diagnostics: [{ code: 'not-scanned', severity: 'info', message: 'init does not run adapters. Run featurefacts scan.' }],
  }));
  const created = !existsSync(ws.manifestPath);
  const manifest = buildManifest({
    scanId: registry.scan_id,
    generatedAt: localTimestamp(),
    status: 'partial',
    config,
    files: ctx.files,
    exclusions: ctx.exclusions.filter((item) => item.path && item.path !== '.'),
    adapters,
    registry,
    projection: result.label.generated.projection_fingerprint,
    artifacts: result.artifacts,
    diagnostics: [{ code: 'not-scanned', severity: 'info', message: 'init records the scope only. Run featurefacts scan to observe it.' }],
    ecosystems: [],
  });
  if (writeJson(ws.manifestPath, manifest) && created) result.changed.push('.featurefacts/manifest.json');
  return { changed: result.changed };
}
