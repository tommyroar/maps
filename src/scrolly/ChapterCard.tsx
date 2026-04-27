import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { Chapter } from '../engine/content-loader';
import { Markdown } from '../components/Markdown';
import { PhotoSlider } from '../components/PhotoSlider';

interface ChapterCardProps {
  chapter: Chapter;
  active: boolean;
  isFirst: boolean;
}

export function ChapterCard({ chapter, active, isFirst }: ChapterCardProps) {
  const { frontmatter, body, photos, slug } = chapter;
  const IconComponent = frontmatter.icon
    ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[
        frontmatter.icon
      ]
    : null;

  return (
    <section
      id={`chapter-${slug}`}
      data-slug={slug}
      data-step
      className={`chapter ${isFirst ? 'chapter-hero' : ''}`}
    >
      <motion.article
        className="chapter-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: active ? 1 : 0.55, y: active ? 0 : 12 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {IconComponent && (
          <div className="chapter-icon" aria-hidden>
            <IconComponent size={24} color={frontmatter.iconColor ?? 'currentColor'} />
          </div>
        )}
        <h2 className="chapter-title">{frontmatter.title}</h2>
        {frontmatter.subtitle && <p className="chapter-subtitle">{frontmatter.subtitle}</p>}
        <div className="chapter-body">
          <Markdown content={body} photos={photos} />
        </div>
        {frontmatter.overlays?.photoSlider && (
          <PhotoSlider config={frontmatter.overlays.photoSlider} photos={photos} />
        )}
        {frontmatter.cta && (
          <a className="chapter-cta" href={frontmatter.cta.href} target="_blank" rel="noreferrer">
            {frontmatter.cta.label}
          </a>
        )}
      </motion.article>
    </section>
  );
}
