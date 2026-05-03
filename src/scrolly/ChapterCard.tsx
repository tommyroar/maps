import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { Chapter } from '../engine/content-loader';
import { Markdown } from '../components/Markdown';
import { PhotoSlider } from '../components/PhotoSlider';

interface ChapterCardProps {
  chapter: Chapter;
  active: boolean;
}

export function ChapterCard({ chapter, active }: ChapterCardProps) {
  const { frontmatter, body, photos, slug } = chapter;
  const isHero = frontmatter.hero === true;
  const accent = frontmatter.iconColor ?? frontmatter.color ?? 'var(--color-primary)';
  const IconComponent = frontmatter.icon
    ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[
        frontmatter.icon
      ]
    : null;

  const renderedPhotos = (frontmatter.photos ?? []).map((p) => ({
    ...p,
    src: photos[p.src] ?? photos[`./${p.src}`] ?? p.src,
  }));

  return (
    <section
      id={`chapter-${slug}`}
      data-slug={slug}
      data-step
      className={`chapter ${isHero ? 'chapter-hero' : ''}`}
    >
      <motion.article
        className={`chapter-card ${isHero ? 'chapter-card-hero' : ''}`}
        initial={{ opacity: 0, x: isHero ? 0 : -24, y: isHero ? 20 : 0 }}
        animate={{ opacity: active ? 1 : 0.6, x: 0, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {!isHero && IconComponent && (
          <div
            className="chapter-icon"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            <IconComponent size={20} color="white" strokeWidth={2} />
          </div>
        )}
        {!isHero && frontmatter.subtitle && (
          <p className="chapter-eyebrow" style={{ color: accent }}>
            {frontmatter.subtitle}
          </p>
        )}
        <h2 className={isHero ? 'chapter-title-hero' : 'chapter-title'}>{frontmatter.title}</h2>
        <div className={`chapter-body ${isHero ? 'chapter-body-hero' : ''}`}>
          <Markdown content={body} photos={photos} />
        </div>
        {renderedPhotos.length === 1 && (
          <figure className="chapter-photo">
            <img src={renderedPhotos[0].src} alt={renderedPhotos[0].alt ?? ''} />
            {renderedPhotos[0].alt && <figcaption>{renderedPhotos[0].alt}</figcaption>}
          </figure>
        )}
        {frontmatter.overlays?.photoSlider && (
          <PhotoSlider config={frontmatter.overlays.photoSlider} photos={photos} />
        )}
        {frontmatter.cta && (
          <a className="chapter-cta" href={frontmatter.cta.href} target="_blank" rel="noreferrer">
            {frontmatter.cta.label}
          </a>
        )}
        {isHero && <p className="chapter-scroll-hint">Scroll to explore ↓</p>}
      </motion.article>
    </section>
  );
}
