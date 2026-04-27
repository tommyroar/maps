import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';

interface PhotoSliderConfig {
  before: string;
  after: string;
  options?: { id: string; src: string; label: string }[];
}

interface PhotoSliderProps {
  config: PhotoSliderConfig;
  photos: Record<string, string>;
}

function resolve(src: string, photos: Record<string, string>): string {
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return photos[src] ?? photos[`./${src}`] ?? src;
}

export function PhotoSlider({ config, photos }: PhotoSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeOption, setActiveOption] = useState<string | null>(
    config.options && config.options.length > 0 ? config.options[0].id : null
  );
  const sliderX = useMotionValue(0.5);
  const clipPath = useTransform(sliderX, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    sliderX.set(v);
  }, [sliderX]);

  const overlay = (() => {
    if (!activeOption || !config.options) return resolve(config.after, photos);
    const opt = config.options.find((o) => o.id === activeOption);
    return opt ? resolve(opt.src, photos) : resolve(config.after, photos);
  })();
  const beforeUrl = resolve(config.before, photos);

  return (
    <div className="photo-slider">
      <div
        ref={containerRef}
        className="photo-slider-frame"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) updateFromClientX(e.clientX);
        }}
      >
        <img className="photo-slider-img" src={beforeUrl} alt="before" draggable={false} />
        <motion.img
          className="photo-slider-img photo-slider-overlay"
          src={overlay}
          alt="after"
          draggable={false}
          style={{ clipPath }}
        />
        <motion.div
          className="photo-slider-handle"
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={(_, info: PanInfo) => updateFromClientX(info.point.x)}
          style={{ left: useTransform(sliderX, (v) => `${v * 100}%`) }}
        >
          <span className="photo-slider-handle-line" />
          <span className="photo-slider-handle-knob" />
        </motion.div>
      </div>
      {config.options && config.options.length > 1 && (
        <div className="photo-slider-tabs">
          {config.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`photo-slider-tab ${activeOption === o.id ? 'is-active' : ''}`}
              onClick={() => setActiveOption(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
