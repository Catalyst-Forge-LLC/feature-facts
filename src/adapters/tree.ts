import { ADAPTERS } from '../version.ts';
import type { AdapterMeta, ScanContext } from '../types.ts';
import { markEligible, markInspected } from '../safety.ts';

export function runTree(ctx: ScanContext): AdapterMeta {
  const eligible = markEligible(ctx.files, ADAPTERS.tree.id, () => true);
  markInspected(ctx.files, ADAPTERS.tree.id, eligible);
  return {
    id: ADAPTERS.tree.id,
    version: ADAPTERS.tree.version,
    kind: 'tree',
    state: 'completed',
    eligible_files: eligible,
    inspected_files: eligible,
    diagnostics: [],
  };
}
