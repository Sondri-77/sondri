// Shared pin/scrub runner for cinematic stages (how-it-works assembly,
// industries rank). Handles progress smoothing, beat fades, cue/readout,
// and render-loop lifecycle. The homepage hero (./index.ts) predates this
// helper and keeps its own copy because of its hero-fallback handling.

import type { OrbitScene } from './scene';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export interface ScrubOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  sticky: HTMLElement;
  cue: HTMLElement | null;
  readout: HTMLElement | null;
  readoutText(p: number): string;
  scene: OrbitScene;
}

export function runScrubStage(o: ScrubOptions): void {
  const beats = Array.from(o.stage.querySelectorAll<HTMLElement>('.beat')).map((el) => ({
    el,
    from: parseFloat(el.dataset.from || '0'),
    to: parseFloat(el.dataset.to || '1'),
  }));

  const rawProgress = (): number => {
    const r = o.stage.getBoundingClientRect();
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
      const op = clamp01(Math.min(rampIn, (1 - local) / 0.18));
      b.el.style.visibility = 'visible';
      b.el.style.opacity = op.toFixed(3);
      const dir = local < 0.5 ? 1 : -1;
      b.el.style.transform = `translateY(${((1 - op) * 22 * dir).toFixed(1)}px)`;
    }
    if (o.cue) o.cue.style.opacity = String(clamp01(1 - p / 0.03));
    if (o.readout) o.readout.textContent = o.readoutText(p);
  };

  const size = () => o.scene.resize(o.sticky.clientWidth, o.sticky.clientHeight);
  size();
  window.addEventListener('resize', size);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(size).observe(o.sticky);
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
    o.scene.render(smoothed, time);
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
  io.observe(o.stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (o.stage.getBoundingClientRect().bottom > 0) start();
  });

  start();
}
