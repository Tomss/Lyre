import Lenis from 'lenis';

interface ModalLenisEntry {
  lenis: Lenis;
  rafId: number;
}

const activeModalLenisInstances = new Map<HTMLElement, ModalLenisEntry>();

/**
 * Attaches a dedicated, high-performance Lenis smooth scroll instance
 * to any modal or popup container.
 * Automatically pauses main page scrolling to avoid scroll bleed and GPU stutter.
 */
export function attachModalSmoothScroll(container: HTMLElement | null): () => void {
  if (!container || !(container instanceof HTMLElement)) return () => {};

  // If already attached, return detachment function
  if (activeModalLenisInstances.has(container)) {
    return () => detachModalSmoothScroll(container);
  }

  // Pause main page Lenis
  try {
    const mainLenis = (window as any).__lenis;
    if (mainLenis && typeof mainLenis.stop === 'function') {
      mainLenis.stop();
    }
  } catch (e) {}

  // Apply anti-saccade hardware acceleration styles
  container.style.overscrollBehavior = 'contain';
  container.style.webkitOverflowScrolling = 'touch';
  container.classList.add('modal-smooth-scroll');

  const content = (container.firstElementChild as HTMLElement) || container;

  try {
    const modalLenis = new Lenis({
      wrapper: container,
      content: content,
      duration: 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      autoResize: true,
    });

    let rafId: number;
    function raf(time: number) {
      modalLenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    activeModalLenisInstances.set(container, { lenis: modalLenis, rafId });

    return () => {
      detachModalSmoothScroll(container);
    };
  } catch (err) {
    console.warn('Failed to initialize Lenis on modal:', err);
    return () => {};
  }
}

/**
 * Detaches and cleanly destroys a modal Lenis smooth scroll instance.
 * Resumes main page Lenis once all modals are closed.
 */
export function detachModalSmoothScroll(container: HTMLElement | null) {
  if (!container) return;
  const instance = activeModalLenisInstances.get(container);
  if (instance) {
    cancelAnimationFrame(instance.rafId);
    try {
      instance.lenis.destroy();
    } catch (e) {}
    activeModalLenisInstances.delete(container);
  }

  // If no other modal is currently active, resume main window Lenis
  if (activeModalLenisInstances.size === 0) {
    try {
      const mainLenis = (window as any).__lenis;
      if (mainLenis && typeof mainLenis.start === 'function') {
        mainLenis.start();
        setTimeout(() => {
          if (mainLenis && typeof mainLenis.resize === 'function') {
            mainLenis.resize();
          }
        }, 50);
      }
    } catch (e) {}
  }
}
