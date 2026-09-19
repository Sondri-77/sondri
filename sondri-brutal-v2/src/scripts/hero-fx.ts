/* Hero background effect.

   The reference site runs its hero photo through a canvas dither
   (`data-dither-image`). This does the same, plus two things on top: an
   animated noise layer composited with a blend mode (CSS, in Hero.astro), and
   a pixel cursor trail on its own canvas (`pixel-trail.ts`).

   The photo is already a monochrome teal duotone on disk; here it is reduced
   to luminance and re-quantised through an ordered (Bayer 4x4) dither, so the
   image is drawn in a handful of steps between teal and white. */

import { createPixelTrail } from './pixel-trail';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Teal -> white ramp. Four steps reads as dithered without going to 1-bit mud. */
const RAMP: [number, number, number][] = [
  [3, 25, 25],
  [26, 64, 62],
  [120, 150, 148],
  [255, 255, 255],
];

const LEVELS = RAMP.length - 1;

export function initHeroFx(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dither]');
  const src = root.querySelector<HTMLImageElement>('[data-dither-src]');
  if (!canvas || !src) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Working resolution. Deliberately coarse — the upscale is the look.
  let w = 0;
  let h = 0;
  let lum = new Uint8ClampedArray(0);
  let out: ImageData | null = null;
  let frame = 0;
  let raf = 0;

  // Mouse only: the trail makes no sense under a finger, and reduced motion
  // gets the still dither with nothing following the cursor.
  const trailCv = root.querySelector<HTMLCanvasElement>('[data-trail]');
  const trail = finePointer && !reduced && trailCv ? createPixelTrail(root, trailCv) : null;

  /** Draw the photo once at working resolution and keep only its luminance. */
  const sample = () => {
    if (!src.complete || !src.naturalWidth) return;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    if (!octx) return;

    // cover
    const sa = src.naturalWidth / src.naturalHeight;
    const da = w / h;
    let sw = src.naturalWidth;
    let sh = src.naturalHeight;
    let sx = 0;
    let sy = 0;
    if (sa > da) {
      sw = src.naturalHeight * da;
      sx = (src.naturalWidth - sw) / 2;
    } else {
      sh = src.naturalWidth / da;
      sy = (src.naturalHeight - sh) / 2;
    }
    octx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);

    const d = octx.getImageData(0, 0, w, h).data;
    lum = new Uint8ClampedArray(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      // S-curve: the four-step ramp needs the midtones pulled apart.
      lum[p] = (255 * Math.min(1, Math.max(0, (g / 255 - 0.5) * 1.45 + 0.52))) | 0;
    }
  };

  const measure = () => {
    const r = root.getBoundingClientRect();
    const aspect = r.height > 0 ? r.width / r.height : 1.6;
    w = 420;
    h = Math.max(120, Math.round(w / aspect));
    canvas.width = w;
    canvas.height = h;
    out = ctx.createImageData(w, h);
    sample();
    trail?.resize();
  };

  const draw = () => {
    if (!out || !lum.length) return;
    const data = out.data;

    // The noise term is what animates: it shifts the dither threshold every
    // frame, so flat areas shimmer instead of banding.
    const jitter = reduced ? 0 : 11;
    const ox = frame & 3;
    const oy = (frame >> 1) & 3;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const l: number = lum[i];

        const t = (BAYER[(y + oy) & 3][(x + ox) & 3] / 16 - 0.5) * 38;
        const n = jitter ? (Math.random() - 0.5) * jitter : 0;

        let v = (l + t + n) / 255;
        v = v < 0 ? 0 : v > 1 ? 1 : v;

        const c = RAMP[Math.round(v * LEVELS)];
        const p = i * 4;
        data[p] = c[0];
        data[p + 1] = c[1];
        data[p + 2] = c[2];
        data[p + 3] = 255;
      }
    }

    ctx.putImageData(out, 0, 0);
  };

  // One rAF loop. The dither redraws at ~24fps (the photo isn't moving; the
  // dither is); the trail decays every tick, as in the playground.
  let last = 0;
  const loop = (now: number) => {
    if (now - last > 41) {
      last = now;
      frame++;
      draw();
    }
    trail?.frame(now);
    raf = requestAnimationFrame(loop);
  };

  window.addEventListener('resize', () => measure(), { passive: true });

  if (src.complete) measure();
  else src.addEventListener('load', measure, { once: true });

  if (reduced) {
    const once = () => draw();
    if (src.complete) once();
    else src.addEventListener('load', once, { once: true });
    return;
  }

  raf = requestAnimationFrame(loop);

  // Stop burning frames once the hero is off screen.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      else if (!e.isIntersecting && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
  });
  io.observe(root);
}
