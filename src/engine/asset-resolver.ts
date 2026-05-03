const dataAssets = import.meta.glob('/content/data/**/*', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const routeAssets = import.meta.glob('/content/routes/**/*.json', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const allAssets = { ...dataAssets, ...routeAssets };

export function resolveContentAsset(refPath: string): string {
  const normalized = refPath.startsWith('/') ? refPath : `/${refPath}`;
  const url = allAssets[normalized];
  if (!url) {
    throw new Error(
      `Asset not found in content/: ${refPath}. Known: ${Object.keys(allAssets).join(', ') || '(none)'}`
    );
  }
  return url;
}
