export interface Annotation {
  id: string;
  line: number;
}

const PATTERNS = [
  /(?:featurefacts|@featurefacts)\s*[:=]\s*([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/gi,
  /<!--\s*featurefacts:\s*([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\s*-->/gi,
];

export function findAnnotations(text: string): Annotation[] {
  const hits: Annotation[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(lines[i]))) {
        hits.push({ id: match[1], line: i + 1 });
      }
    }
  }
  return hits;
}
