/**
 * Modal Kinetic Smooth Scroll Engine with Anti-Saccade Interpolation
 * 
 * Provides buttery smooth 60/120 FPS inertial scrolling to all modals, popups,
 * and dialogs while pausing the background page to prevent CPU/GPU competition.
 */

interface ModalScrollInstance {
  container: HTMLElement;
  cleanup: () => void;
}

const activeModalInstances = new Map<HTMLElement, ModalScrollInstance>();

/**
 * Attaches fluid kinetic smooth scrolling to a modal container.
 */
export function attachModalSmoothScroll(container: HTMLElement | null): () => void {
  if (!container || !(container instanceof HTMLElement)) return () => {};

  // If already attached, return detachment function
  if (activeModalInstances.has(container)) {
    return () => detachModalSmoothScroll(container);
  }

  // Pause main page Lenis while modal is open
  try {
    const mainLenis = (window as any).__lenis;
    if (mainLenis && typeof mainLenis.stop === 'function') {
      mainLenis.stop();
    }
  } catch (e) {}

  // Apply GPU containment and anti-saccade styles
  container.style.overscrollBehavior = 'contain';
  container.style.webkitOverflowScrolling = 'touch';
  container.classList.add('modal-smooth-scroll');

  let currentScroll = container.scrollTop;
  let targetScroll = container.scrollTop;
  let rafId: number | null = null;
  let isRunning = false;

  const easeOutQuad = (x: number): number => 1 - (1 - x) * (1 - x);

  const update = () => {
    if (!isRunning) return;

    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

    const diff = targetScroll - currentScroll;

    if (Math.abs(diff) < 0.3) {
      currentScroll = targetScroll;
      container.scrollTop = currentScroll;
      isRunning = false;
      rafId = null;
      return;
    }

    // Smooth Lerp factor (0.16 provides fluid, responsive glide without latency)
    currentScroll += diff * 0.16;
    container.scrollTop = Math.round(currentScroll * 10) / 10;

    rafId = requestAnimationFrame(update);
  };

  const onWheel = (e: WheelEvent) => {
    // Only smooth vertical scrolling if container is actually scrollable
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;

    // Check if deltaMode is lines or pages and normalize
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 30; // Lines
    else if (e.deltaMode === 2) delta *= 400; // Pages

    // Trackpad gestures (small rapid deltas) vs Mouse Wheel (discrete larger ticks)
    const isTrackpad = Math.abs(delta) < 40 && !Number.isInteger(delta);
    const multiplier = isTrackpad ? 1.0 : 1.15;

    // Check if we can scroll in this direction
    const atTop = container.scrollTop <= 0 && delta < 0;
    const atBottom = container.scrollTop >= maxScroll && delta > 0;

    if (!atTop && !atBottom) {
      // Prevent browser native discrete step jump to handle it smoothly
      e.preventDefault();
      e.stopPropagation();

      if (!isRunning) {
        currentScroll = container.scrollTop;
        targetScroll = container.scrollTop;
        isRunning = true;
      }

      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + delta * multiplier));

      if (rafId === null) {
        rafId = requestAnimationFrame(update);
      }
    }
  };

  // Sync state if user drags scrollbar or touches
  const onScroll = () => {
    if (!isRunning) {
      currentScroll = container.scrollTop;
      targetScroll = container.scrollTop;
    }
  };

  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('scroll', onScroll, { passive: true });

  const cleanup = () => {
    isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    container.removeEventListener('wheel', onWheel);
    container.removeEventListener('scroll', onScroll);
    activeModalInstances.delete(container);

    // Resume main page Lenis once all modals are closed
    if (activeModalInstances.size === 0) {
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

  activeModalInstances.set(container, { container, cleanup });

  return () => {
    detachModalSmoothScroll(container);
  };
}

/**
 * Detaches smooth scrolling from a modal container.
 */
export function detachModalSmoothScroll(container: HTMLElement | null) {
  if (!container) return;
  const instance = activeModalInstances.get(container);
  if (instance) {
    instance.cleanup();
  }
}
