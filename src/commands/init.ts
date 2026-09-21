import { emptyRegistry } from '../defaults.ts';
import { defaultConfig } from '../defaults.ts';
import { productNameFromRoot } from '../project.ts';
import { writeGenerated } from '../write-artifacts.ts';
import { workspaceAt } from '../workspace.ts';

export function initCommand(root: string): { changed: string[] } {
  const ws = workspaceAt(root);
  const config = defaultConfig();
  const registry = emptyRegistry('scan-init', productNameFromRoot(root));
  const today = new Date().toISOString().slice(0, 10);
  const result = writeGenerated({
    ws,
    config,
    registry,
    surfaces: [],
    date: today,
    writeConfig: true,
  });
  return { changed: result.changed };
}
