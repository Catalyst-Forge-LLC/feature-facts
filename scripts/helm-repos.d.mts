export interface DiscoveredRepo {
  name: string;
  path: string;
  absPath: string;
  enrolled: boolean;
}

export interface RegisteredRepo {
  id: string;
  name: string;
  path: string;
  absPath: string;
}

export function stateDir(featureFactsRoot: string): string;
export function reposFile(featureFactsRoot: string): string;
export function hasRegister(dir: string): boolean;
export function isRepo(dir: string): boolean;
export function discoverRepos(root: string, maxDepth?: number): DiscoveredRepo[];
export function readRemembered(featureFactsRoot: string): string[];
export function rememberRepos(featureFactsRoot: string, absPaths: string[]): string[];
export function registeredRepos(featureFactsRoot: string): RegisteredRepo[];
