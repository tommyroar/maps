import { parseFrontmatter } from './frontmatter';
import { chapterFrontmatter, type ChapterFrontmatter } from './schema';

export interface Chapter {
  slug: string;
  directory: string;
  order: number;
  frontmatter: ChapterFrontmatter;
  body: string;
  photos: Record<string, string>;
}

const rawChapterMarkdown = import.meta.glob('/content/chapters/*/content.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const chapterPhotos = import.meta.glob(
  '/content/chapters/*/*.{jpg,jpeg,png,webp,gif,svg}',
  { query: '?url', import: 'default', eager: true }
) as Record<string, string>;

const aboutMdModules = import.meta.glob('/content/about.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

function deriveSlug(directory: string): { slug: string; order: number } {
  const name = directory.split('/').pop() ?? directory;
  const m = name.match(/^(\d+)[-_](.+)$/);
  if (m) return { slug: m[2], order: parseInt(m[1], 10) };
  return { slug: name, order: Number.MAX_SAFE_INTEGER };
}

export function loadChapters(): Chapter[] {
  const entries = Object.entries(rawChapterMarkdown).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  return entries.map(([path, raw]) => {
    const directory = dirOf(path);
    const { slug: derivedSlug, order } = deriveSlug(directory);
    const { data, content } = parseFrontmatter(raw);
    const fm = chapterFrontmatter.safeParse(data);
    if (!fm.success) {
      const issues = fm.error.issues
        .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid frontmatter in ${path}:\n${issues}`);
    }
    const photos: Record<string, string> = {};
    for (const [photoPath, url] of Object.entries(chapterPhotos)) {
      if (dirOf(photoPath) === directory) {
        const filename = photoPath.slice(directory.length + 1);
        photos[filename] = url;
        photos[`./${filename}`] = url;
      }
    }
    return {
      slug: fm.data.slug ?? derivedSlug,
      directory,
      order,
      frontmatter: fm.data,
      body: content,
      photos,
    };
  });
}

export function loadAboutMarkdown(): string | null {
  const entries = Object.values(aboutMdModules);
  if (entries.length === 0) return null;
  return parseFrontmatter(entries[0]).content;
}
