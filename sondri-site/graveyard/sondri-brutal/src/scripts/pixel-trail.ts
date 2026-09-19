/* Cursor trail — a port of the seshling playground's PIXEL_TRAIL (§03,
   `fx-playground.html` ~874-953), which is itself the ReactBits PixelTrail
   without three.js.

   A low-res intensity grid (one float per CELL×CELL square) sits over the
   hero. Pointer moves stamp round falloff discs into it — interpolated along
   the path so fast moves stay contiguous — and every frame each cell loses
   `dt / DECAY`, so the tail is residue, not history. STEPPED snaps the fade
   to four alpha levels so the decay flips instead of glides.

   Unlike the playground, the trail is not painted to its own canvas. It is
   rasterised (`render`) into an alpha buffer at hero-fx's working resolution
   and blended into the photo's luminance there, so the tail goes through the
   same gradient map, Bayer dither and grain as the picture instead of sitting
   on top as a flat sprite. The playground's GOO SVG filter (blur + alpha
   `19a - 9`) is replicated in-buffer for GOO > 0.

   Constants are the captain's slider settings, mapped the way the playground
   binds them (`bind('t-…')`, ~936-945). */

/** GRID slider: cell size in CSS px (`CELL = Math.max(3, v)`). */
const CELL = 19;
/** RADIUS slider: stamp radius in cells, used directly (`RAD = v`). */
const RAD = 4.1;
/** DECAY slider: ms for a cell to fade from 1 to 0 (`DECAY = Math.max(16, v)`). */
const DECAY = 415;
/** CORNER slider: corner radius as % of CELL. 0 = hard squares (captain, round 4). */
const CORNER = 0;
/** GOO slider: feGaussianBlur stdDeviation in CSS px. 0 = off — the cells
    stay square and the four fade steps survive the 19a-9 threshold. */
const GOO = 0;
/** FADE: STEPPED quantises alpha to `ceil(v * 4) / 4`. */
const STEPPED = true;

export interface TrailBounds { x0: number; y0: number; x1: number; y1: number }

export interface PixelTrail {
  /** Decay. Call once per rAF tick. True while any cell is alive. */
  frame(ts: number): boolean;
  /** Re-fit the grid to the root's current size. Clears the trail. */
  resize(): void;
  setActive(active: boolean): void;
  /** Rasterise the live cells into `buf` — one alpha (0..1) per pixel of a
      bw×bh buffer that covers the root. Returns null (buf untouched) when
      the trail is empty. */
  render(buf: Float32Array, bw: number, bh: number): TrailBounds | null;
}

export function createPixelTrail(root: HTMLElement): PixelTrail {
  let active = false;
  let cols = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let vals = new Float32Array(0);
  let alive = false;
  let px = -1;
  let py = -1;
  let pending: { x: number; y: number }[] = [];
  let last = 0;
  let stampTime = 0;

  function size() {
    const r = root.getBoundingClientRect();
    width = r.width;
    height = r.height;
    cols = Math.ceil(r.width / CELL);
    rows = Math.ceil(r.height / CELL);
    vals = new Float32Array(cols * rows);
    alive = false;
    pending = [];
    px = py = -1;
    last = stampTime = 0;
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
    alive = true;
  }

  // Events only collect coordinates; stamping and decay belong to hero's rAF.
  root.addEventListener('pointermove', (e) => {
    if (!active) return;
    const r = root.getBoundingClientRect();
    pending.push({ x: e.clientX - r.left, y: e.clientY - r.top });
  });
  root.addEventListener('pointerleave', () => {
    if (!active) return;
    pending.push({ x: -1, y: -1 });
  });

  function samplePointer() {
    for (const { x, y } of pending) {
      if (x < 0) { px = py = -1; continue; }
      if (px >= 0) {
        const steps = Math.ceil(Math.hypot(x - px, y - py) / (CELL / 2));
        for (let i = 1; i <= steps; i++) stamp(px + ((x - px) * i) / steps, py + ((y - py) * i) / steps);
      } else stamp(x, y);
      px = x;
      py = y;
    }
    pending = [];
  }

  function frame(ts: number): boolean {
    const dt = last ? Math.min(100, ts - last) : 0;
    last = ts;
    stampTime += dt;
    if (stampTime >= 45) {
      stampTime %= 45;
      samplePointer();
    }
    if (!alive) return false;
    const dec = dt / DECAY;
    let any = false;
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (v <= 0) continue;
      const n = v - dec;
      vals[i] = n <= 0 ? 0 : n;
      if (n > 0) any = true;
    }
    alive = any;
    return any;
  }

  function render(buf: Float32Array, bw: number, bh: number): TrailBounds | null {
    if (!alive || !width || !height) return null;
    const sx = width / bw;
    const sy = height / bh;
    const rad = (CORNER / 100) * CELL;
    let minX = cols, minY = rows, maxX = -1, maxY = -1;
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
      if (vals[gy * cols + gx] <= 0) continue;
      minX = Math.min(minX, gx); minY = Math.min(minY, gy);
      maxX = Math.max(maxX, gx); maxY = Math.max(maxY, gy);
    }
    if (maxX < 0) return null;
    const bounds: TrailBounds = GOO > 0 ? { x0: 0, y0: 0, x1: bw, y1: bh } : {
      x0: Math.max(0, Math.floor(minX * CELL / sx)),
      y0: Math.max(0, Math.floor(minY * CELL / sy)),
      x1: Math.min(bw, Math.ceil((maxX + 1) * CELL / sx)),
      y1: Math.min(bh, Math.ceil((maxY + 1) * CELL / sy)),
    };
    // The playground insets each square by 1 CSS px; at working resolution
    // (~3 CSS px per buffer pixel) that gap is sub-pixel, so it is dropped.
    for (let by = bounds.y0; by < bounds.y1; by++) {
      const y = (by + 0.5) * sy;
      const gy = (y / CELL) | 0;
      for (let bx = bounds.x0; bx < bounds.x1; bx++) {
        const x = (bx + 0.5) * sx;
        const gx = (x / CELL) | 0;
        const v = gx < cols && gy < rows ? vals[gy * cols + gx] : 0;
        let a = 0;
        if (v > 0) {
          a = STEPPED ? Math.ceil(v * 4) / 4 : v;
          if (rad > 0) {
            // Corner rounding: outside the corner circles the square is empty.
            const u = x - gx * CELL;
            const w = y - gy * CELL;
            const dx = u < rad ? rad - u : u > CELL - rad ? u - (CELL - rad) : 0;
            const dy = w < rad ? rad - w : w > CELL - rad ? w - (CELL - rad) : 0;
            if (dx * dx + dy * dy > rad * rad) a = 0;
          }
        }
        buf[by * bw + bx] = a;
      }
    }
    if (GOO > 0) goo(buf, bw, bh, GOO / sx);
    return bounds;
  }

  return { frame, resize: size, render, setActive(value) { active = value; } };
}

/** In-buffer stand-in for the playground's #goo-trail SVG filter:
    feGaussianBlur(σ) then feColorMatrix alpha `19a - 9`, clamped. The
    `atop` composite only mattered for colour, which is uniform here. */
function goo(buf: Float32Array, bw: number, bh: number, sigma: number) {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;

  const tmp = new Float32Array(buf.length);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const xx = x + i;
        if (xx >= 0 && xx < bw) acc += buf[y * bw + xx] * k[i + r];
      }
      tmp[y * bw + x] = acc;
    }
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const yy = y + i;
        if (yy >= 0 && yy < bh) acc += tmp[yy * bw + x] * k[i + r];
      }
      const a = acc * 19 - 9;
      buf[y * bw + x] = a < 0 ? 0 : a > 1 ? 1 : a;
    }
}
