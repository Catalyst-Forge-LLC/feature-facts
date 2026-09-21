import { existsSync } from 'node:fs';
import { writeJson } from '../workspace.ts';
import { writeGenerated } from '../write-artifacts.ts';
import { loadConfig, loadManifest, loadRegistry, loadSurfaces, workspaceAt } from '../workspace.ts';

export function reportCommand(root: string): { changed: string[] } {
  const ws = workspaceAt(root);
  const config = loadConfig(ws);
  const registry = loadRegistry(ws);
  if (!registry) throw new Error('No register found. Run featurefacts init or scan first.');
  const surfaces = loadSurfaces(ws);
  const prior = loadManifest(ws);
  const date = prior?.generated_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const written = writeGenerated({ ws, config, registry, surfaces, date });
  if (prior && existsSync(ws.manifestPath)) {
    const next = {
      ...prior,
      fingerprints: {
        ...prior.fingerprints,
        registry: written.label.generated.projection_fingerprint ? prior.fingerprints.registry : prior.fingerprints.registry,
        projection: written.label.generated.projection_fingerprint,
      },
      artifacts: written.artifacts,
    };
    writeJson(ws.manifestPath, next);
  }
  return { changed: written.changed };
}
