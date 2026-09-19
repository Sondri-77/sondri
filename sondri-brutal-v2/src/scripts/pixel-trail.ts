/* Cursor trail — a port of the seshling playground's PIXEL_TRAIL (§03,
   `fx-playground.html` ~874-953), which is itself the ReactBits PixelTrail
   without three.js.

   A low-res intensity grid (one float per CELL×CELL square) sits over the
   hero. Pointer moves stamp round falloff discs into it — interpolated along
   the path so fast moves stay contiguous — and every frame each cell loses
   `dt / DECAY`, so the tail is residue, not history. Live cells are drawn as
   rounded squares at full resolution; the GOO SVG filter on the canvas
   (Hero.astro) blurs and re-thresholds the alpha so neighbouring squares weld
   into one blob, and STEPPED snaps the fade to four alpha levels so the decay
   flips instead of glides.

   Constants are the captain's slider settings, mapped the way the playground
   binds them (`bind('t-…')`, ~936-945). */

/** GRID slider: cell size in CSS px (`CELL = Math.max(3, v)`). */
const CELL = 19;
/** RADIUS slider: stamp radius in cells, used directly (`RAD = v`). */
const RAD = 4.1;
/** DECAY slider: ms for a cell to fade from 1 to 0 (`DECAY = Math.max(16, v)`). */
const DECAY = 1660;
/** CORNER slider: corner radius as % of CELL (`rad = CORNER / 100 * CELL`). */
const CORNER = 22;
/** GOO slider: feGaussianBlur stdDeviation of the #goo-trail filter (Hero.astro). */
const GOO = 4;
/** FADE: STEPPED quantises alpha to `ceil(v * 4) / 4`. */
const STEPPED = true;
/** Ink. The hero ramp's mid teal (hero-fx RAMP[1]) — `--teal` (#081f1f) is
    the photo's darkest step, so a blob in it vanishes over the dark half. */
const INK: [number, number, number] = [26, 64, 62];

export interface PixelTrail {
  /** Decay and redraw. Call once per rAF tick. */
  frame(ts: number): void;
  /** Re-fit the grid to the root's current size. Clears the trail. */
  resize(): void;
}

export function createPixelTrail(root: HTMLElement, cv: HTMLCanvasElement): PixelTrail | null {
  const ctx = cv.getContext('2d');
  if (!ctx) return null;

  document.getElementById('goo-blur')?.setAttribute('stdDeviation', String(GOO));
  cv.style.filter = GOO > 0 ? 'url(#goo-trail)' : 'none';

  let cols = 0;
  let rows = 0;
  let vals = new Float32Array(0);
  let px = -1;
  let py = -1;

  function size() {
    const r = root.getBoundingClientRect();
    cols = Math.ceil(r.width / CELL);
    rows = Math.ceil(r.height / CELL);
    vals = new Float32Array(cols * rows);
    cv.width = r.width;
    cv.height = r.height;
  }
  size();

  function stamp(x: number, y: number) {
    const cx = x / CELL - 0.5;
    const cy = y / CELL - 0.5;
    const R = RAD;
    const x0 = Math.max(0, Math.floor(cx - R));
    const x1 = Math.min(cols - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R));
    const y1 = Math.min(rows - 1, Math.ceil(cy + R));
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const d = Math.hypot(gx - cx, gy - cy);
        if (d > R) continue;
        const v = 1 - (d / R) * (d / R);
        const i = gy * cols + gx;
        if (v > vals[i]) vals[i] = v;
      }
    }
  }

  root.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (px >= 0) {
      const steps = Math.ceil(Math.hypot(x - px, y - py) / (CELL / 2));
      for (let i = 1; i <= steps; i++) stamp(px + ((x - px) * i) / steps, py + ((y - py) * i) / steps);
    } else stamp(x, y);
    px = x;
    py = y;
  });
  root.addEventListener('pointerleave', () => {
    px = py = -1;
  });

  let last = 0;
  function frame(ts: number) {
    const dt = Math.min(100, ts - last);
    last = ts;
    ctx!.clearRect(0, 0, cv.width, cv.height);
    const dec = dt / DECAY;
    const rad = (CORNER / 100) * CELL;
    for (let i = 0; i < vals.length; i++) {
      let v = vals[i];
      if (v <= 0) continue;
      vals[i] = v = v - dec;
      if (v <= 0) {
        vals[i] = 0;
        continue;
      }
      const a = STEPPED ? Math.ceil(v * 4) / 4 : v;
      ctx!.fillStyle = 'rgba(' + INK[0] + ',' + INK[1] + ',' + INK[2] + ',' + a.toFixed(3) + ')';
      const x = (i % cols) * CELL;
      const y = ((i / cols) | 0) * CELL;
      if (rad > 0) {
        ctx!.beginPath();
        ctx!.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, rad);
        ctx!.fill();
      } else ctx!.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    }
  }

  return { frame, resize: size };
}
