/* Hero background effect.

   The reference site runs its hero photo through a canvas dither
   (`data-dither-image`). This does the same, plus two things on top: an
   animated noise layer composited with a blend mode (CSS, in Hero.astro), and
   a cursor "comet" — a pixelated teal blob that follows a fine pointer,
   swells with speed, trails a tail of shrinking blocks and dies out when the
   pointer rests.

   The photo is already a monochrome teal duotone on disk; here it is reduced
   to luminance and re-quantised through an ordered (Bayer 4x4) dither, so the
   image is drawn in a handful of steps between teal and white.

   The dither canvas is opaque, so the comet is not a layer under it: it is
   blended into the luminance before quantising. That way it is built from the
   same cells and the same four colours, and its rim dithers into the photo
   like everything else. */

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

/** Luminance that quantises to RAMP[1], the mid teal — the comet's colour. */
const COMET_LUM = 85;

/** Comet tuning. Sizes are CSS px and converted to working cells on measure. */
const COMET_MAX_RADIUS_PX = 100; // hard cap: ~200px across at full heat
const COMET_HEAT_PX = 300; // pointer travel (px) that takes heat from 0 to 1
const COMET_COOL = 0.82; // heat kept per frame at ~24fps: gone in ~0.8s
const COMET_TAIL = 10; // frames of history drawn behind the head

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

  // Comet state, all in working cells. `mask` is the comet's coverage per
  // cell, rebuilt every frame from the tail history; `heat` is how fast the
  // pointer has been moving lately and drives size and opacity.
  let mask = new Float32Array(0);
  let scale = 1; // working cells per CSS px
  let px = -9999;
  let py = -9999;
  let tx = -9999;
  let ty = -9999;
  let heat = 0;
  let hot = false; // pointer on the hero and moving
  const tailX = new Float32Array(COMET_TAIL);
  const tailY = new Float32Array(COMET_TAIL);
  const tailR = new Float32Array(COMET_TAIL);
  let tailHead = 0;

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
    scale = r.width > 0 ? w / r.width : 1;
    canvas.width = w;
    canvas.height = h;
    out = ctx.createImageData(w, h);
    mask = new Float32Array(w * h);
    sample();
  };

  /** Stamp one comet block into the mask: solid core, one-cell dithered rim. */
  const stamp = (cx: number, cy: number, r: number, a: number) => {
    if (r < 0.5) return;
    const r2 = r * r;
    const x0 = Math.max(0, (cx - r) | 0);
    const x1 = Math.min(w - 1, (cx + r + 1) | 0);
    const y0 = Math.max(0, (cy - r) | 0);
    const y1 = Math.min(h - 1, (cy + r + 1) | 0);
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        let f = (1 - d2 / r2) * 3;
        f = (f > 1 ? 1 : f) * a;
        const i = y * w + x;
        if (f > mask[i]) mask[i] = f;
      }
    }
  };

  /** Advance the comet one frame and rebuild its mask. Returns false if idle. */
  const comet = () => {
    if (hot) {
      // The head sits close on the cursor; the tail is what lags.
      const nx = px + (tx - px) * 0.55;
      const ny = py + (ty - py) * 0.55;
      const travel = Math.hypot(nx - px, ny - py) / scale;
      px = nx;
      py = ny;
      heat = Math.min(1, heat + travel / COMET_HEAT_PX);
    }
    heat *= COMET_COOL;
    if (heat < 0.01) {
      heat = 0;
      tailR.fill(0); // so a later entry doesn't resurrect stale blocks
      return false;
    }

    // Record the head, then draw the history oldest-first so the newest
    // blocks win. Radius shrinks along the tail; the whole thing fades with
    // heat so a stopped cursor shrinks and dies rather than snapping off.
    tailX[tailHead] = px;
    tailY[tailHead] = py;
    tailR[tailHead] = heat * COMET_MAX_RADIUS_PX * scale;
    tailHead = (tailHead + 1) % COMET_TAIL;

    mask.fill(0);
    const alpha = Math.min(1, heat * 3);
    for (let k = 0; k < COMET_TAIL; k++) {
      const i = (tailHead + k) % COMET_TAIL;
      const age = (k + 1) / COMET_TAIL; // 1 = head
      stamp(tailX[i], tailY[i], tailR[i] * age * age, alpha * age);
    }
    return true;
  };

  const draw = () => {
    if (!out || !lum.length) return;
    const data = out.data;

    // The noise term is what animates: it shifts the dither threshold every
    // frame, so flat areas shimmer instead of banding.
    const jitter = reduced ? 0 : 11;
    const ox = frame & 3;
    const oy = (frame >> 1) & 3;

    const withComet = !reduced && finePointer && comet();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let l: number = lum[i];

        // The comet pulls luminance toward its own ramp step before the
        // threshold, so it quantises with the photo instead of sitting on it.
        if (withComet) {
          const m = mask[i];
          if (m > 0) l += (COMET_LUM - l) * m;
        }

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

  // Mouse only: the comet makes no sense under a finger, and reduced motion
  // gets the still dither with nothing following the cursor.
  if (finePointer && !reduced) {
    root.addEventListener('pointermove', (e) => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * w;
      ty = ((e.clientY - r.top) / r.height) * h;
      if (!hot) {
        // Fresh entry: start the head on the cursor so there's no streak in.
        px = tx;
        py = ty;
        hot = true;
      }
    });
    root.addEventListener('pointerleave', () => {
      hot = false;
    });
  }

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
