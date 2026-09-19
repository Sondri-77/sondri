/* Hero background effect.

   The reference site runs its hero photo through a canvas dither
   (`data-dither-image`). This does the same, plus an animated noise layer
   composited with a blend mode (CSS, in Hero.astro).

   The photo is already a monochrome teal duotone on disk; here it is reduced
   to luminance and re-quantised through an ordered (Bayer 4x4) dither, so the
   image is drawn in a handful of steps between deep teal and light teal.

   The pixel cursor trail (`pixel-trail.ts`) is blended into that luminance
   before the ramp and dither run, so it is graded, dithered and grained like
   the photo rather than drawn over it. */

import { createPixelTrail, type TrailBounds } from './pixel-trail';

export const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Teal -> white ramp. Four steps reads as dithered without going to 1-bit mud.
    Exported (the one edit to v2's file) so dither-block.ts shares the palette.
    The hero itself draws with HERO_RAMP below. */
export const RAMP: [number, number, number][] = [
  [3, 25, 25],
  [26, 64, 62],
  [120, 150, 148],
  [255, 255, 255],
];

/** The hero's own ramp: same dark/mid stops, but the top is capped at a light
    teal instead of white so the headline and lede stay the only pure white in
    the hero. #5c918c is the lightest teal that keeps white text at >= 3:1
    (WCAG AA for the display headline) over the brightest possible image
    region; the lede sits in the veil's dark band and clears 4.5:1 there.
    dither-block.ts keeps RAMP (its blocks carry no text). */
export const HERO_RAMP: [number, number, number][] = [
  RAMP[0],
  RAMP[1],
  [62, 105, 102],
  [92, 145, 140],
];

const LEVELS = HERO_RAMP.length - 1;

/** Luminance the trail pulls the photo toward. 85/255 lands exactly on
    RAMP[1] — the mid teal, i.e. brand green after grading — so the tail reads
    as a lighter region over the dark ground and a darker one over the sky,
    and quantises to the same green either way. (Pure light → a white blob;
    pure dark → invisible over the dark half, which is RAMP[0] already.) */
const TRAIL_LUM = 85;

// The integer LUT preserves the original half-integer ramp boundaries.
const GRADIENT = new Uint8ClampedArray(256 * 3);
for (let l = 0; l < 256; l++) GRADIENT.set(HERO_RAMP[Math.round(l / 255 * LEVELS)], l * 3);

interface GrainPhase {
  static: HTMLCanvasElement;
  // Five possible STEPPED trail alphas: 0, 1/4, 1/2, 3/4, 1.
  graded: Uint8ClampedArray[];
}

export function initHeroFx(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dither]');
  const src = root.querySelector<HTMLImageElement>('[data-dither-src]');
  if (!canvas || !src) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const trail = finePointer ? createPixelTrail(root) : null;
  let w = 0;
  let h = 0;
  let lum = new Uint8ClampedArray(0);
  let out: ImageData;
  let trailA = new Float32Array(0);
  let phases: GrainPhase[] = [];
  let previous: TrailBounds | null = null;
  let phase = 0;
  let raf = 0;
  let visible = true;
  let last = 0;
  let painted = 0;
  let grainTime = 0;
  let slow = false;
  let badFrames = 0;
  let goodTime = 0;

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

  // Bake noise before quantisation, exactly where the old pipeline applied it.
  // Eight full-size noise tiles also cover the eight Bayer phase offsets.
  // Baking each stepped alpha avoids regrading any pixels during animation.
  function cache() {
    phases = [];
    const count = motion.matches ? 1 : 8;
    for (let f = 0; f < count; f++) {
      const thresholds = new Uint8Array(w * h);
      const noise = new Float64Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        thresholds[i] = BAYER[(y + (f >> 1)) & 3][(x + f) & 3];
        noise[i] = motion.matches ? 0 : (Math.random() - 0.5) * 11;
      }
      const graded: Uint8ClampedArray[] = [];
      for (let a = 0; a < (motion.matches ? 1 : 5); a++) {
        const pixels = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < lum.length; i++) {
          const l = lum[i] + a / 4 * (TRAIL_LUM - lum[i]);
          const value = l + (thresholds[i] / 16 - 0.5) * 38 + noise[i];
          const q = Math.max(0, Math.min(255, Math.floor(value + 0.5))) * 3;
          const p = i * 4;
          pixels[p] = GRADIENT[q];
          pixels[p + 1] = GRADIENT[q + 1];
          pixels[p + 2] = GRADIENT[q + 2];
          pixels[p + 3] = 255;
        }
        graded.push(pixels);
      }
      const still = document.createElement('canvas');
      still.width = w;
      still.height = h;
      const staticImage = new ImageData(w, h);
      staticImage.data.set(graded[0]);
      still.getContext('2d')!.putImageData(staticImage, 0, 0);
      phases.push({ static: still, graded });
    }
  }

  function draw(grainChanged: boolean) {
    const tile = phases[phase];
    if (!tile) return;
    const bounds = motion.matches ? null : trail?.render(trailA, w, h) ?? null;
    if (grainChanged) ctx!.drawImage(tile.static, 0, 0);
    // Include the previous extent so the final faded cells get restored.
    const dirty = bounds && previous ? {
      x0: Math.min(bounds.x0, previous.x0), y0: Math.min(bounds.y0, previous.y0),
      x1: Math.max(bounds.x1, previous.x1), y1: Math.max(bounds.y1, previous.y1),
    } : bounds ?? previous;
    if (dirty) {
      for (let y = dirty.y0; y < dirty.y1; y++) for (let x = dirty.x0; x < dirty.x1; x++) {
        const i = y * w + x;
        const inside = bounds && x >= bounds.x0 && x < bounds.x1 && y >= bounds.y0 && y < bounds.y1;
        const pixels = tile.graded[inside ? trailA[i] * 4 : 0];
        const p = i * 4;
        out.data[p] = pixels[p];
        out.data[p + 1] = pixels[p + 1];
        out.data[p + 2] = pixels[p + 2];
        out.data[p + 3] = 255;
      }
      ctx!.putImageData(out, 0, 0, dirty.x0, dirty.y0, dirty.x1 - dirty.x0, dirty.y1 - dirty.y0);
    }
    previous = bounds;
  }

  function measure() {
    if (!src!.complete || !src!.naturalWidth) return;
    const r = root.getBoundingClientRect();
    const aspect = r.height > 0 ? r.width / r.height : 1.6;
    // CSS-sized working buffer, independent of devicePixelRatio (DPR <= 1).
    w = 420;
    h = Math.max(120, Math.round(w / aspect));
    canvas!.width = w;
    canvas!.height = h;
    out = ctx!.createImageData(w, h);
    trailA = new Float32Array(w * h);
    sample();
    trail?.resize();
    previous = null;
    phase = 0;
    grainTime = 0;
    cache();
    draw(true);
  }

  function loop(now: number) {
    raf = 0;
    // Media/visibility events can arrive after a queued animation callback.
    if (motion.matches) { measure(); sync(); return; }
    if (!visible || document.hidden) return;
    const dt = last ? now - last : 0;
    last = now;
    // Judge actual frame gaps, including work elsewhere on the page.
    if (!slow) {
      badFrames = dt > 24 ? badFrames + 1 : 0;
      if (badFrames >= 2) { slow = true; goodTime = 0; }
    } else {
      goodTime = dt <= 24 ? goodTime + dt : 0;
      if (goodTime >= 2000) { slow = false; badFrames = 0; }
    }
    grainTime += dt;
    // Simulation still sees every rAF; its stamp accumulator stays at 45 ms.
    trail?.frame(now);
    if (!slow || now - painted >= 1000 / 30 - 0.5) {
      const interval = slow ? 164 : 82;
      const ticks = Math.floor(grainTime / interval);
      if (ticks && phases.length) {
        grainTime %= interval;
        phase = (phase + ticks) % phases.length;
      }
      draw(ticks > 0);
      painted = now;
    }
    raf = requestAnimationFrame(loop);
  }

  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = painted = 0;
    trail?.resize();
    trail?.setActive(!motion.matches && visible && !document.hidden);
    if (motion.matches) draw(true);
    if (!motion.matches && visible && !document.hidden) raf = requestAnimationFrame(loop);
  }
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { measure(); sync(); });
  const io = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    sync();
  });
  io.observe(root);
  if (src.complete) measure();
  else src.addEventListener('load', measure, { once: true });
  sync();
}
