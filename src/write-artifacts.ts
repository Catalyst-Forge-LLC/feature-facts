import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { SCHEMA_VERSION } from './version.ts';
import { sha256Bytes } from './hash.ts';
import { projectGaps, projectIndexes, projectLabel } from './project.ts';
import { renderLabelBody, renderRegister } from './render.ts';
import type { Config, Manifest, Registry, Surface } from './types.ts';
import { loadLabel, writeJson, writeLabel, writeYaml, type Workspace } from './workspace.ts';
import { writeIfChanged } from './yaml-io.ts';

function rel(ws: Workspace, abs: string): string {
  return relative(ws.root, abs).split('\\').join('/');
}

export function writeGenerated(args: {
  ws: Workspace;
  config: Config;
  registry: Registry;
  surfaces: Surface[];
  date: string;
  writeConfig?: boolean;
}): { label: ReturnType<typeof projectLabel>; artifacts: Manifest['artifacts']; changed: string[] } {
  const { ws, config, registry, surfaces, date } = args;
  const changed: string[] = [];
  if (args.writeConfig && writeYaml(ws.configPath, config)) changed.push(rel(ws, ws.configPath));
  if (writeYaml(ws.featuresPath, registry)) changed.push(rel(ws, ws.featuresPath));
  if (writeJson(ws.featuresJsonPath, registry)) changed.push(rel(ws, ws.featuresJsonPath));
  if (writeJson(ws.surfacesPath, { schemaVersion: SCHEMA_VERSION, scan_id: registry.scan_id, surfaces })) {
    changed.push(rel(ws, ws.surfacesPath));
  }
  const indexes = projectIndexes(registry.features, registry.scan_id);
  if (writeJson(ws.docsIndexPath, indexes.docs)) changed.push(rel(ws, ws.docsIndexPath));
  if (writeJson(ws.testIndexPath, indexes.tests)) changed.push(rel(ws, ws.testIndexPath));
  if (writeYaml(ws.gapsPath, projectGaps(registry.features, registry.scan_id))) {
    changed.push(rel(ws, ws.gapsPath));
  }
  if (writeIfChanged(ws.featuresMdPath, renderRegister(registry, registry.features))) {
    changed.push(rel(ws, ws.featuresMdPath));
  }
  const priorLabel = loadLabel(ws);
  let label = projectLabel(registry, config, priorLabel?.data.generated.date ?? date);
  if (
    priorLabel &&
    priorLabel.data.generated.projection_fingerprint === label.generated.projection_fingerprint
  ) {
    label = {
      ...label,
      generated: priorLabel.data.generated,
    };
  } else {
    label = projectLabel(registry, config, date);
  }
  if (writeLabel(ws, label, renderLabelBody(label))) changed.push(rel(ws, ws.labelPath));

  const artifacts = [
    ws.configPath,
    ws.featuresPath,
    ws.featuresJsonPath,
    ws.surfacesPath,
    ws.docsIndexPath,
    ws.testIndexPath,
    ws.gapsPath,
    ws.featuresMdPath,
    ws.labelPath,
  ]
    .map((path) => ({ path: rel(ws, path), sha256: sha256Bytes(readFileSync(path)) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return { label, artifacts, changed };
}
