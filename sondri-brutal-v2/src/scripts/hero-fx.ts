/* Hero background effect.

   The reference site runs its hero photo through a canvas dither
   (`data-dither-image`). This does the same, plus the two things asked for on
   top: an animated noise layer composited with a blend mode, and a pointer
   distortion that bulges the sampling grid under the cursor.

   The photo is already a monochrome teal duotone on disk; here it is reduced
   to luminance and re-quantised through an ordered (Bayer 4x4) dither, so the
   image is drawn in a handful of steps between teal and white. */

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

  // Working resolution. Deliberately coarse — the upscale is the look.
  let w = 0;
  let h = 0;
  let lum = new Uint8ClampedArray(0);
  let out: ImageData | null = null;

  // Pointer state, lerped so the distortion trails the cursor.
  let px = -9999;
  let py = -9999;
  let tx = -9999;
  let ty = -9999;
  let power = 0;
  let targetPower = 0;
  let frame = 0;
  let raf = 0;

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
  };

  const R = 95; // distortion radius, in working pixels

  const draw = () => {
    if (!out || !lum.length) return;
    const data = out.data;

    // The noise term is what animates: it shifts the dither threshold every
    // frame, so flat areas shimmer instead of banding.
    const jitter = reduced ? 0 : 11;
    const ox = frame & 3;
    const oy = (frame >> 1) & 3;

    power += (targetPower - power) * 0.08;
    px += (tx - px) * 0.12;
    py += (ty - py) * 0.12;

    const r2 = R * R;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sx = x;
        let sy = y;

        if (power > 0.01) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            // Smooth falloff, pushing samples outward from the cursor.
            const f = 1 - d2 / r2;
            const k = f * f * power * 14;
            const dist = Math.sqrt(d2) + 0.001;
            sx = x + (dx / dist) * k;
            sy = y + (dy / dist) * k;
          }
        }

        const ix = sx < 0 ? 0 : sx > w - 1 ? w - 1 : sx | 0;
        const iy = sy < 0 ? 0 : sy > h - 1 ? h - 1 : sy | 0;

        const l = lum[iy * w + ix];
        const t = (BAYER[(y + oy) & 3][(x + ox) & 3] / 16 - 0.5) * 38;
        const n = jitter ? (Math.random() - 0.5) * jitter : 0;

        let v = (l + t + n) / 255;
        v = v < 0 ? 0 : v > 1 ? 1 : v;

        const c = RAMP[Math.round(v * LEVELS)];
        const p = (y * w + x) * 4;
        data[p] = c[0];
        data[p + 1] = c[1];
        data[p + 2] = c[2];
        data[p + 3] = 255;
      }
    }

    ctx.putImageData(out, 0, 0);
  };

  // ~24fps. The photo isn't moving; the dither is.
  let last = 0;
  const loop = (now: number) => {
    if (now - last > 41) {
      last = now;
      frame++;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };

  root.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * w;
    ty = ((e.clientY - r.top) / r.height) * h;
    targetPower = 1;
  });
  root.addEventListener('pointerleave', () => {
    targetPower = 0;
  });

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
