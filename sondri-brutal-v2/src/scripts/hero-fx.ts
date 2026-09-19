/* Hero background effect.

   The reference site runs its hero photo through a canvas dither
   (`data-dither-image`). This does the same, plus two things on top: an
   animated noise layer composited with a blend mode (CSS, in Hero.astro), and
   a cursor "comet" — a fuzzy, chunky teal cloud that follows a fine pointer,
   swells with speed, smears one continuous tail along its path and dies out
   when the pointer rests.

   The photo is already a monochrome teal duotone on disk; here it is reduced
   to luminance and re-quantised through an ordered (Bayer 4x4) dither, so the
   image is drawn in a handful of steps between teal and white.

   The dither canvas is opaque, so the comet is not a layer under it: it is
   blended into the luminance before quantising. That way it is built from the
   same colours as the photo. It is drawn on its own, coarser grid though: a
   heat field at a fraction of the working resolution, blurred, snapped to a
   few levels through the same Bayer matrix, then upscaled nearest-neighbour
   into the luminance. Blur before snap is what makes it read as a cloud with
   chunky edges rather than a hard sprite. */

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
const COMET_CELL = 4; // working cells per comet cell (~13 CSS px at 1440 wide)
const COMET_BLUR = [1, 4, 6, 4, 1]; // separable 5-tap, radius 2 comet cells
const COMET_BLUR_SUM = 16;
const COMET_LEVELS = 2; // coverage snaps to 0 / ½ / 1 after the blur
const COMET_SPACING = 0.3; // sample spacing along the path, as a fraction of radius
const COMET_SAMPLES = 32; // max new samples per frame, however far the pointer went
const COMET_RING = 512; // samples kept; ~20 frames of life × 32 per frame, rounded up

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

  // Comet state. Pointer positions are in working cells; the field buffers
  // are on the coarser comet grid (cw × ch). `field` is stamped from the
  // sample ring every frame, blurred through `tmp`, then snapped into `cq`,
  // which `draw` reads. `heat` is how fast the pointer has been moving lately
  // and drives the head's size.
  let cw = 0;
  let ch = 0;
  let field = new Float32Array(0);
  let tmp = new Float32Array(0);
  let cq = new Float32Array(0);
  let scale = 1; // working cells per CSS px
  let px = -9999;
  let py = -9999;
  let tx = -9999;
  let ty = -9999;
  let heat = 0;
  let hot = false; // pointer on the hero and moving
  // Sample ring: position and birth radius in comet cells, plus remaining
  // life (1 → 0). Oldest entries get overwritten when it wraps.
  const sX = new Float32Array(COMET_RING);
  const sY = new Float32Array(COMET_RING);
  const sR = new Float32Array(COMET_RING);
  const sL = new Float32Array(COMET_RING);
  let sHead = 0;

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
    cw = Math.ceil(w / COMET_CELL);
    ch = Math.ceil(h / COMET_CELL);
    field = new Float32Array(cw * ch);
    tmp = new Float32Array(cw * ch);
    cq = new Float32Array(cw * ch);
    sample();
  };

  /** Stamp one soft disc into the field (max-composited, radial falloff). */
  const stamp = (cx: number, cy: number, r: number, a: number) => {
    if (r < 0.5) return;
    const r2 = r * r;
    const x0 = Math.max(0, (cx - r) | 0);
    const x1 = Math.min(cw - 1, (cx + r + 1) | 0);
    const y0 = Math.max(0, (cy - r) | 0);
    const y1 = Math.min(ch - 1, (cy + r + 1) | 0);
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        const f = (1 - d2 / r2) * a;
        const i = y * cw + x;
        if (f > field[i]) field[i] = f;
      }
    }
  };

  /** Push one sample onto the ring. */
  const emit = (x: number, y: number, r: number) => {
    sX[sHead] = x;
    sY[sHead] = y;
    sR[sHead] = r;
    sL[sHead] = 1;
    sHead = (sHead + 1) % COMET_RING;
  };

  /** Separable binomial blur of `field`, in place, via `tmp`. Edges clamp. */
  const blur = () => {
    const k = COMET_BLUR;
    const kr = (k.length - 1) >> 1;
    for (let y = 0; y < ch; y++) {
      const row = y * cw;
      for (let x = 0; x < cw; x++) {
        let acc = 0;
        for (let j = -kr; j <= kr; j++) {
          let xx = x + j;
          xx = xx < 0 ? 0 : xx >= cw ? cw - 1 : xx;
          acc += field[row + xx] * k[j + kr];
        }
        tmp[row + x] = acc / COMET_BLUR_SUM;
      }
    }
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        let acc = 0;
        for (let j = -kr; j <= kr; j++) {
          let yy = y + j;
          yy = yy < 0 ? 0 : yy >= ch ? ch - 1 : yy;
          acc += tmp[yy * cw + x] * k[j + kr];
        }
        field[y * cw + x] = acc / COMET_BLUR_SUM;
      }
    }
  };

  /** Advance the comet one frame and rebuild `cq`. Returns false if idle. */
  const comet = () => {
    // Head radius in comet cells at the current heat.
    const headR = () => (heat * COMET_MAX_RADIUS_PX * scale) / COMET_CELL;

    if (hot) {
      // The head sits close on the cursor; the tail is what lags.
      const nx = px + (tx - px) * 0.6;
      const ny = py + (ty - py) * 0.6;
      const dist = Math.hypot(nx - px, ny - py);
      heat = Math.min(1, heat + dist / scale / COMET_HEAT_PX);

      // Lay samples densely along last → current so the trail is one smear,
      // not a chain of discs: spacing well under the radius, and never more
      // than the per-frame cap (spread evenly if the pointer outran it).
      const r = headR();
      const step = Math.max(1, r * COMET_SPACING) * COMET_CELL; // working cells
      const n = Math.min(COMET_SAMPLES, Math.ceil(dist / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        emit((px + (nx - px) * t) / COMET_CELL, (py + (ny - py) * t) / COMET_CELL, r);
      }
      px = nx;
      py = ny;
    }
    heat *= COMET_COOL;

    // Age the ring. Radius shrinks slower than opacity so the body stays fat
    // near the head and thins toward the tail; both are gone within ~1s.
    let live = false;
    field.fill(0);
    for (let i = 0; i < COMET_RING; i++) {
      const l = sL[i];
      if (l <= 0) continue;
      const nl = l * COMET_COOL;
      if (nl < 0.02) {
        sL[i] = 0;
        continue;
      }
      sL[i] = nl;
      live = true;
      stamp(sX[i], sY[i], sR[i] * Math.pow(nl, 0.6), nl);
    }
    if (!live) {
      heat = 0;
      return false;
    }

    // Blur first, then snap: the soft field is quantised to a few levels
    // through the Bayer matrix on the comet grid, so the fuzzy rim comes out
    // as chunky dithered cells rather than a smooth gradient.
    blur();
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        const v = field[i] + (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.5;
        let q = Math.round(v * COMET_LEVELS) / COMET_LEVELS;
        q = q < 0 ? 0 : q > 1 ? 1 : q;
        cq[i] = q;
      }
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
      const crow = ((y / COMET_CELL) | 0) * cw;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let l: number = lum[i];

        // The comet pulls luminance toward its own ramp step before the
        // threshold, so it quantises with the photo instead of sitting on it.
        // Nearest-neighbour from the comet grid: each comet cell covers a
        // COMET_CELL² block of working cells.
        if (withComet) {
          const m = cq[crow + ((x / COMET_CELL) | 0)];
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
