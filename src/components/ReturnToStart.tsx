import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ReturnToStartProps {
  firstSlug: string | null;
}

export function ReturnToStart({ firstSlug }: ReturnToStartProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setShow(document.body.dataset.atEnd === 'true');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-at-end'] });
    return () => observer.disconnect();
  }, []);

  if (!firstSlug) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          className="return-to-start"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ↑ Return to start
        </motion.button>
      )}
    </AnimatePresence>
  );
}
