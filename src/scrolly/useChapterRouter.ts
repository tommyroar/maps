import { useCallback, useEffect, useState } from 'react';
import type { Chapter } from '../engine/content-loader';

function readSlugFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;
  const m = hash.match(/^#\/?([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function useChapterRouter(chapters: Chapter[]) {
  const [activeSlug, setActiveSlug] = useState<string | null>(() => readSlugFromHash());

  useEffect(() => {
    const onHash = (): void => setActiveSlug(readSlugFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setActive = useCallback(
    (slug: string | null, opts?: { replaceHash?: boolean }): void => {
      setActiveSlug(slug);
      if (opts?.replaceHash !== false) {
        const next = slug ? `#/${slug}` : '#';
        if (window.location.hash !== next) {
          window.history.replaceState(null, '', next);
        }
      }
    },
    []
  );

  const scrollToSlug = useCallback((slug: string): void => {
    const el = document.getElementById(`chapter-${slug}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeIndex = chapters.findIndex((c) => c.slug === activeSlug);

  return { activeSlug, activeIndex, setActive, scrollToSlug };
}
