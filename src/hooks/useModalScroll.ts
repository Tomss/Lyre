import { useEffect, useRef } from 'react';
import { attachModalSmoothScroll } from '../utils/modalScroll';

/**
 * React hook to automatically attach a Lenis smooth scroll instance
 * to a modal ref when open, and cleanly detach when closed.
 */
export function useModalScroll<T extends HTMLElement = HTMLDivElement>(isOpen: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const cleanup = attachModalSmoothScroll(ref.current);
    return cleanup;
  }, [isOpen]);

  return ref;
}
