import { existsSync } from 'node:fs';
import { writeJson } from '../workspace.ts';
import { writeGenerated } from '../write-artifacts.ts';
import { loadConfig, loadManifest, loadRegistry, loadSurfaces, workspaceAt } from '../workspace.ts';
import { localDate, localDateOf } from '../time.ts';

export function reportCommand(root: string): { changed: string[]; manifestMissing: boolean } {
  const ws = workspaceAt(root);
  const config = loadConfig(ws);
  const registry = loadRegistry(ws);
  if (!registry) throw new Error('No register found. Run featurefacts init or scan first.');
  const surfaces = loadSurfaces(ws);
  const prior = loadManifest(ws);
  const date = localDateOf(prior?.generated_at) ?? localDate();
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
  // report does not rescan, so it cannot write a missing manifest without claiming a scan basis.
  return { changed: written.changed, manifestMissing: !prior };
}
