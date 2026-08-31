import Lenis from 'lenis';

interface ModalLenisEntry {
  lenis: Lenis;
  rafId: number;
}

const activeModalLenisInstances = new Map<HTMLElement, ModalLenisEntry>();

/**
 * Attaches the official Lenis smooth scroll engine directly to any modal container,
 * using the EXACT same exponential decay easing and physics as the main page.
 */
export function attachModalSmoothScroll(container: HTMLElement | null): () => void {
  if (!container || !(container instanceof HTMLElement)) return () => {};

  // If already attached, return detachment function
  if (activeModalLenisInstances.has(container)) {
    return () => detachModalSmoothScroll(container);
  }

  // Pause main page Lenis to eliminate any background CPU/GPU thread competition
  try {
    const mainLenis = (window as any).__lenis;
    if (mainLenis && typeof mainLenis.stop === 'function') {
      mainLenis.stop();
    }
  } catch (e) {}

  // Apply GPU containment and anti-saccade styles
  container.style.scrollBehavior = 'auto';
  container.style.overscrollBehavior = 'contain';
  container.style.webkitOverflowScrolling = 'touch';
  container.style.touchAction = 'pan-y';
  container.classList.add('modal-smooth-scroll');

  // Find the closest modal backdrop or window to capture all wheel events over the modal
  const modalOverlay = container.closest('.fixed') || container;

  try {
    const modalLenis = new Lenis({
      wrapper: container,
      eventsTarget: modalOverlay as HTMLElement,
      duration: 0.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      autoResize: true,
      prevent: () => false,
    });

    container.scrollTop = 0;
    modalLenis.scrollTo(0, { immediate: true });

    let rafId: number;
    function raf(time: number) {
      modalLenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Real-time ResizeObserver so when images inside modal load, Lenis recalculates bounds immediately
    const modalResizeObserver = new ResizeObserver(() => {
      modalLenis.resize();
    });
    modalResizeObserver.observe(container);
    if (container.firstElementChild) {
      modalResizeObserver.observe(container.firstElementChild);
    }

    const cleanup = () => {
      modalResizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      try {
        modalLenis.destroy();
      } catch (e) {}
      activeModalLenisInstances.delete(container);

      // Resume main page Lenis once all modals are closed
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
    };

    activeModalLenisInstances.set(container, { lenis: modalLenis, rafId });

    return cleanup;
  } catch (err) {
    console.warn('Failed to initialize Lenis on modal:', err);
    return () => {};
  }
}

/**
 * Detaches and cleanly destroys a modal Lenis smooth scroll instance.
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

  // Resume main page Lenis if all modals are closed
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
