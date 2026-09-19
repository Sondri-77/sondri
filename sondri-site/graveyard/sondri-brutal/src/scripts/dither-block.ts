/* Static dithered image slots — logo boxes, avatars, feature marks.

   Every `<canvas data-dither-block>` on the page gets the hero's treatment
   once: a procedural luminance field (a lit disc on a diagonal falloff, seeded
   per block so no two are identical) run through the same gradient-map RAMP
   and Bayer matrix as hero-fx.ts, at a coarse working resolution and upscaled
   with image-rendering: pixelated. No animation — these are placeholders that
   should read as part of the same picture as the hero, not compete with it.

   `data-shape="disc"` (avatars) lights a centred disc; the default lights a
   wide band, which reads as a wordmark-shaped blob in a logo box;
   `data-shape="flat"` lights nothing (the feature tiles overlay a pixel icon
   where the blob would be). */

import { BAYER, RAMP } from './hero-fx';

const LEVELS = RAMP.length - 1;
/** Working px per CSS px. ~3 CSS px per working pixel matches the hero. */
const SCALE = 1 / 3.4;

/** Small deterministic PRNG so the blocks are stable across reloads. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBlock(cv: HTMLCanvasElement, index: number) {
  const ctx = cv.getContext('2d', { alpha: false });
  if (!ctx) return;
  const r = cv.getBoundingClientRect();
  const w = Math.max(8, Math.round(r.width * SCALE));
  const h = Math.max(8, Math.round(r.height * SCALE));
  cv.width = w;
  cv.height = h;

  const seed = Number(cv.dataset.seed ?? index) + 1;
  const rnd = mulberry(seed * 7919);
  const disc = cv.dataset.shape === 'disc';
  const flat = cv.dataset.shape === 'flat';

  // Light source: a disc for avatars, a wide flat band for logos/marks.
  const cx = disc ? 0.5 : 0.35 + rnd() * 0.3;
  const cy = disc ? 0.42 : 0.5;
  const rx = disc ? 0.3 : 0.32 + rnd() * 0.12;
  const ry = disc ? 0.3 * (w / h) : 0.16 + rnd() * 0.08;
  const tilt = (rnd() - 0.5) * 0.9;
  const ox = rnd() * 4;
  const oy = rnd() * 4;

  const out = ctx.createImageData(w, h);
  const d = out.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w;
      const v = (y + 0.5) / h;
      // Diagonal falloff, the way the hero's veil grades the photo.
      let l = 0.16 + (1 - v) * 0.12 + (u - 0.5) * tilt * 0.4;
      // The lit shape.
      const dx = (u - cx) / rx;
      const dy = (v - cy) / ry;
      const dd = dx * dx + dy * dy;
      if (dd < 1 && !flat) l += (1 - dd) * 0.85;
      if (disc && v > 0.7) l += Math.min(1, (v - 0.7) * 3) * 0.45; // shoulders
      const t = (BAYER[(y + oy) & 3][(x + ox) & 3] / 16 - 0.5) * 0.15;
      const q = Math.max(0, Math.min(1, l + t));
      const c = RAMP[Math.round(q * LEVELS)];
      const p = (y * w + x) * 4;
      d[p] = c[0];
      d[p + 1] = c[1];
      d[p + 2] = c[2];
      d[p + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

export function initDitherBlocks(root: ParentNode = document) {
  const blocks = Array.from(root.querySelectorAll<HTMLCanvasElement>('canvas[data-dither-block]'));
  const draw = () => blocks.forEach(drawBlock);
  draw();
  window.addEventListener('resize', draw, { passive: true });
}
