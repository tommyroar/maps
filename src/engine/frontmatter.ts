import yaml from 'js-yaml';

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(raw: string): FrontmatterResult {
  const match = raw.match(FENCE);
  if (!match) return { data: {}, content: raw };
  const data = (yaml.load(match[1]) as Record<string, unknown> | null) ?? {};
  const content = raw.slice(match[0].length);
  return { data, content };
}
