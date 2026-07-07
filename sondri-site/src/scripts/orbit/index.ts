// Boot + scroll-scrub controller for the cinematic hero.
// - Pins a tall stage; scroll progress drives the camera timeline (rAF-lerped
//   so the turntable feels weighted, Apple-style).
// - Text beats fade/track in and out at progress windows.
// - Fallbacks: reduced motion or no WebGL → the classic 2D dither hero.

import type { OrbitScene } from './scene';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

interface Beat {
  el: HTMLElement;
  from: number;
  to: number;
}

export function initOrbit(): void {
  const stage = document.getElementById('orbit-stage');
  const fallback = document.getElementById('hero-fallback');
  if (!stage) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !webglAvailable()) {
    // collapse the pin space and show the classic 2D hero instead
    stage.remove();
    fallback?.removeAttribute('hidden');
    return;
  }
  fallback?.remove();

  const canvas = stage.querySelector<HTMLCanvasElement>('#orbit-canvas');
  const sticky = stage.querySelector<HTMLElement>('.orbit-sticky');
  if (!canvas || !sticky) return;

  const beats: Beat[] = Array.from(stage.querySelectorAll<HTMLElement>('.beat')).map((el) => ({
    el,
    from: parseFloat(el.dataset.from || '0'),
    to: parseFloat(el.dataset.to || '1'),
  }));
  const readout = stage.querySelector<HTMLElement>('#orbit-readout');
  const cue = stage.querySelector<HTMLElement>('#orbit-cue');

  const rawProgress = (): number => {
    const r = stage.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-r.top / total);
  };

  const updateBeats = (p: number): void => {
    for (const b of beats) {
      const span = b.to - b.from;
      const local = span > 0 ? (p - b.from) / span : -1;
      if (local < 0 || local > 1) {
        b.el.style.opacity = '0';
        b.el.style.visibility = 'hidden';
        continue;
      }
      // beats starting at 0 are visible on load (no ramp-in)
      const rampIn = b.from <= 0.001 ? 1 : local / 0.18;
      const o = clamp01(Math.min(rampIn, (1 - local) / 0.18));
      b.el.style.visibility = 'visible';
      b.el.style.opacity = o.toFixed(3);
      const dir = local < 0.5 ? 1 : -1;
      b.el.style.transform = `translateY(${((1 - o) * 22 * dir).toFixed(1)}px)`;
    }
    if (cue) cue.style.opacity = String(clamp01(1 - p / 0.03));
    if (readout) {
      if (p <= 0.55) {
        const deg = Math.round((p / 0.55) * 360) % 360;
        readout.textContent = `AZ ${String(deg).padStart(3, '0')}°`;
      } else if (p <= 0.7) readout.textContent = 'MACRO 01 — SHOULDER';
      else if (p <= 0.85) readout.textContent = 'MACRO 02 — SAPPHIRE';
      else readout.textContent = 'MACRO 03 — INDICES';
    }
  };

  import('./scene').then(({ createScene }) => {
    const scene: OrbitScene = createScene(canvas);
    const size = () => scene.resize(sticky.clientWidth, sticky.clientHeight);
    size();
    window.addEventListener('resize', size);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(size).observe(sticky);
    }

    let smoothed = rawProgress();
    let running = false;
    let rafId = 0;
    const t0 = performance.now();

    const frame = (now: number): void => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      const time = (now - t0) / 1000;
      const target = rawProgress();
      // exponential smoothing — weighted, never snaps
      smoothed += (target - smoothed) * 0.12;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;
      scene.render(smoothed, time);
      updateBeats(smoothed);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    };
    const stop = (): void => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    // only render while the stage is on screen and the tab is visible
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? start : stop)();
      },
      { threshold: 0 },
    );
    io.observe(stage);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (stage.getBoundingClientRect().bottom > 0) start();
    });

    start();
  });
}
