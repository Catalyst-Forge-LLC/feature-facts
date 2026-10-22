import pkg from '../package.json' with { type: 'json' };

export const TOOL_NAME = 'featurefacts';
/** The package version. esbuild inlines it into dist, so the bin needs no file read at runtime. */
export const TOOL_VERSION: string = pkg.version;
export const SCHEMA_VERSION = '0.2.0';
export const RULE_SET = { rule_set: 'featurefacts-core', version: '0.2.0' } as const;

export const ADAPTERS = {
  tree: { id: 'typescript-tree', version: '0.2.0', kind: 'tree' },
  surface: { id: 'typescript-node-surface', version: '0.2.5', kind: 'surface' },
  document: { id: 'markdown-document', version: '0.2.0', kind: 'document' },
  test: { id: 'typescript-test', version: '0.2.0', kind: 'test' },
} as const;
