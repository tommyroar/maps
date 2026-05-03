import { useEffect, useRef } from 'react';
import scrollama from 'scrollama';
import type { Chapter } from '../engine/content-loader';
import { useMapContext } from '../map/MapProvider';
import { useMapCamera } from '../map/useMapCamera';
import { MapMarkers } from '../map/MapMarkers';
import { useChapterRouter } from './useChapterRouter';
import { ChapterCard } from './ChapterCard';
import { ReturnToStart } from '../components/ReturnToStart';

interface ScrollyTellerProps {
  chapters: Chapter[];
}

export function ScrollyTeller({ chapters }: ScrollyTellerProps) {
  const { map, layers, tracers, ready } = useMapContext();
  const { run } = useMapCamera(map);
  const { activeSlug, setActive, scrollToSlug } = useChapterRouter(chapters);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const showReturnRef = useRef(false);

  // On first ready, if there's a hash, scroll to it. Otherwise scroll to first chapter trigger naturally.
  useEffect(() => {
    if (!ready) return;
    if (activeSlug) scrollToSlug(activeSlug);
  }, [ready, activeSlug, scrollToSlug]);

  // Scrollama wiring
  useEffect(() => {
    if (!ready || !scrollerRef.current) return;
    const scroller = scrollama();
    scroller
      .setup({
        step: '[data-step]',
        offset: 0.55,
        progress: false,
      })
      .onStepEnter((response) => {
        const slug = (response.element as HTMLElement).dataset.slug;
        if (!slug) return;
        const chapter = chapters.find((c) => c.slug === slug);
        if (!chapter) return;
        setActive(slug);
        run(chapter.frontmatter.camera);
        if (layers) {
          layers.apply(
            chapter.frontmatter.layers?.show ?? [],
            chapter.frontmatter.layers?.hide ?? []
          );
        }
        if (tracers) {
          tracers.activate(chapter.frontmatter.tracers?.activate ?? []);
        }
        showReturnRef.current = chapters[chapters.length - 1]?.slug === slug;
        document.body.dataset.atEnd = showReturnRef.current ? 'true' : 'false';
      });
    const onResize = () => scroller.resize();
    window.addEventListener('resize', onResize);
    return () => {
      scroller.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [ready, chapters, layers, run, setActive, tracers]);

  return (
    <>
      <MapMarkers chapters={chapters} activeSlug={activeSlug} />
      <div className="scroller" ref={scrollerRef}>
        {chapters.map((c) => (
          <ChapterCard key={c.slug} chapter={c} active={activeSlug === c.slug} />
        ))}
        <div style={{ height: '40vh' }} aria-hidden />
        <ReturnToStart firstSlug={chapters[0]?.slug ?? null} />
      </div>
    </>
  );
}
