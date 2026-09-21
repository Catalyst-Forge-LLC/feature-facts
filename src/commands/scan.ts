import { runDocument } from '../adapters/document.ts';
import { runSurface } from '../adapters/surface-ts.ts';
import { runTests } from '../adapters/test.ts';
import { runTree } from '../adapters/tree.ts';
import { assembleFeatures, applyProduct } from '../assemble.ts';
import { emptyRegistry } from '../defaults.ts';
import { scanIdFor } from '../hash.ts';
import { buildManifest, productNameFromRoot } from '../project.ts';
import { enumerateTree } from '../safety.ts';
import type { AdapterMeta, Diagnostic, Surface } from '../types.ts';
import { writeJson } from '../workspace.ts';
import { writeGenerated } from '../write-artifacts.ts';
import { loadConfig, loadRegistry, workspaceAt } from '../workspace.ts';

function uniqueSurfaces(items: Surface[]): Surface[] {
  const seen = new Set<string>();
  const out: Surface[] = [];
  for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id) || a.ref.localeCompare(b.ref))) {
    const key = `${item.id}|${item.locator.path}|${item.ref}|${item.provenance.method}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function scanCommand(root: string): { scanId: string; status: string; changed: string[]; diagnostics: Diagnostic[] } {
  const ws = workspaceAt(root);
  const config = loadConfig(ws);
  const prior = loadRegistry(ws);
  const ctx = enumerateTree(root, config);
  const tree = runTree(ctx);
  const surface = runSurface(ctx);
  const docs = runDocument(ctx);
  const tests = runTests(ctx);
  const adapters: AdapterMeta[] = [tree, surface.adapter, docs.adapter, tests.adapter];
  const surfaces = uniqueSurfaces([...surface.surfaces, ...docs.surfaces, ...tests.surfaces]);
  const scanId = scanIdFor([
    ...ctx.files.map((file) => `${file.path}:${file.sha256}`),
    ...adapters.map((adapter) => `${adapter.id}:${adapter.version}:${adapter.state}`),
  ]);
  const registry = prior ?? emptyRegistry(scanId, productNameFromRoot(root));
  registry.scan_id = scanId;
  applyProduct(registry, ctx.contents.get('package.json')?.text, productNameFromRoot(root));
  registry.features = assembleFeatures({
    scanId,
    prior: registry.features,
    surfaces: surface.surfaces,
    docs: docs.surfaces,
    tests: tests.surfaces,
    fileTexts: new Map([...ctx.contents.entries()].map(([path, value]) => [path, value.text])),
  });

  const failed = adapters.some((adapter) => adapter.state === 'failed');
  const partial = adapters.some((adapter) => ['partial', 'unsupported'].includes(adapter.state));
  const status = failed ? 'failed' : partial ? 'partial' : 'complete';
  const diagnostics: Diagnostic[] = adapters.flatMap((adapter) => adapter.diagnostics);
  const generatedAt = new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  const written = writeGenerated({
    ws,
    config: ctx.config,
    registry,
    surfaces,
    date,
    writeConfig: !prior,
  });
  const manifest = buildManifest({
    scanId,
    generatedAt,
    status,
    config: ctx.config,
    files: ctx.files,
    exclusions: ctx.exclusions.filter((item) => item.path && item.path !== '.'),
    adapters,
    registry,
    projection: written.label.generated.projection_fingerprint,
    artifacts: written.artifacts,
    diagnostics,
    ecosystems: surface.ecosystemSupported ? ['typescript-node'] : [],
  });
  writeJson(ws.manifestPath, manifest);
  return { scanId, status, changed: written.changed, diagnostics };
}
