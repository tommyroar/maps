import yaml from 'js-yaml';
import { siteSpec, type SiteSpec } from './schema';

const siteYamlModules = import.meta.glob('/content/site.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadSiteConfig(): SiteSpec {
  const entries = Object.entries(siteYamlModules);
  if (entries.length === 0) {
    throw new Error('No content/site.yaml found.');
  }
  const [, raw] = entries[0];
  const parsed = yaml.load(raw);
  const result = siteSpec.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid content/site.yaml:\n${issues}`);
  }
  return result.data;
}

export function resolveMapboxToken(spec: SiteSpec): string | null {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[spec.mapbox.tokenEnvVar] ?? null;
}
