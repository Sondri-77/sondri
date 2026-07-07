// Boot + scroll-scrub controller for the how-it-works assembly sequence.
// Same pin/scrub mechanics as the homepage hero; on reduced motion or no
// WebGL the stage is removed and the page's classic hero takes over.

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

export function initForge(): void {
  const stage = document.getElementById('forge-stage');
  if (!stage) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !webglAvailable()) {
    stage.remove();
    return;
  }

  const canvas = stage.querySelector<HTMLCanvasElement>('#forge-canvas');
  const sticky = stage.querySelector<HTMLElement>('.orbit-sticky');
  if (!canvas || !sticky) return;

  const beats = Array.from(stage.querySelectorAll<HTMLElement>('.beat')).map((el) => ({
    el,
    from: parseFloat(el.dataset.from || '0'),
    to: parseFloat(el.dataset.to || '1'),
  }));
  const readout = stage.querySelector<HTMLElement>('#forge-readout');
  const cue = stage.querySelector<HTMLElement>('#forge-cue');

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
      const rampIn = b.from <= 0.001 ? 1 : local / 0.18;
      const o = clamp01(Math.min(rampIn, (1 - local) / 0.18));
      b.el.style.visibility = 'visible';
      b.el.style.opacity = o.toFixed(3);
      const dir = local < 0.5 ? 1 : -1;
      b.el.style.transform = `translateY(${((1 - o) * 22 * dir).toFixed(1)}px)`;
    }
    if (cue) cue.style.opacity = String(clamp01(1 - p / 0.03));
    if (readout) {
      if (p <= 0.28) readout.textContent = 'ENGINE 0 — DISCOVER';
      else if (p <= 0.58) readout.textContent = 'ENGINE 0 → 1 — BUILD';
      else if (p <= 0.72) readout.textContent = 'ENGINE 1 — DEPLOY';
      else readout.textContent = 'ENGINE 1 → n — SCALE';
    }
  };

  import('./assembly').then(({ createAssembly }) => {
    const scene: OrbitScene = createAssembly(canvas);
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
