// Sondri dithered-streak image system, ported from the design prototype.
// Every canvas[data-dither] is painted with a two-tone Bayer dither whose
// vertical streaks "develop" the picture; hero/puppet variants carve an
// animated robot silhouette out of the pixel curtain.

type Variant = 'hero' | 'puppet' | 'orb' | 'ridge' | 'gold';

interface RobotState {
  mode: 'hero' | 'puppet';
  cx: number;
  cy: number;
  wave?: number;
  sway: number;
  aspect: number;
  handY?: number;
  chx?: number;
  chy?: number;
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const INK: [number, number, number] = [12, 26, 26];
const SAND: [number, number, number] = [191, 203, 201];
const GOLD: [number, number, number] = [255, 204, 120];
const EYE: [number, number, number] = [230, 242, 240];
const FEAT = 0.012;

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const cov = (dd: number) => (dd >= 0 ? 0 : Math.min(1, -dd / FEAT));
const sbox = (px: number, py: number, bx: number, by: number, hw: number, hh: number) =>
  Math.max(Math.abs(px - bx) - hw, Math.abs(py - by) - hh);
const slimb = (px: number, py: number, hx: number, hy: number, ang: number, len: number, hw: number) => {
  const dx = px - hx, dy = py - hy, c = Math.cos(ang), s = Math.sin(ang);
  const rx = dx * c + dy * s, ry = -dx * s + dy * c;
  return Math.max(Math.abs(rx) - hw, Math.max(-ry, ry - len));
};

function robotHero(RB: RobotState, ax: number, ay: number): number {
  const { cx, cy, sway: S } = RB;
  const W = RB.wave ?? 0;
  let rb = 0;
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.205, 0.072, 0.070)));              // head
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.305, 0.008, 0.030)));              // antenna
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.005, 0.088, 0.120)));              // torso
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy + 0.100, 0.072, 0.030)));              // hips
  rb = Math.max(rb, cov(slimb(ax, ay, cx - 0.095, cy - 0.115, 0.20 + S, 0.205, 0.027)));  // arm L
  rb = Math.max(rb, cov(slimb(ax, ay, cx + 0.095, cy - 0.115, -2.35 + W, 0.215, 0.027))); // arm R waving
  rb = Math.max(rb, cov(slimb(ax, ay, cx - 0.045, cy + 0.105, 0.05 + S, 0.215, 0.034)));  // leg L
  rb = Math.max(rb, cov(slimb(ax, ay, cx + 0.045, cy + 0.105, -0.05 - S, 0.215, 0.034))); // leg R
  return rb;
}

function robotPuppet(RB: RobotState, ax: number, ay: number): number {
  const { cx, cy, sway: S } = RB;
  const armLen = cy - 0.115 - (RB.handY ?? 0);
  let rb = 0;
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.205, 0.070, 0.066)));
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.300, 0.007, 0.028)));
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy - 0.010, 0.086, 0.115)));
  rb = Math.max(rb, cov(sbox(ax, ay, cx, cy + 0.095, 0.070, 0.030)));
  rb = Math.max(rb, cov(slimb(ax, ay, cx + 0.055, cy - 0.115, Math.PI, armLen, 0.026)));  // arm pulling chain
  rb = Math.max(rb, cov(slimb(ax, ay, cx - 0.095, cy - 0.115, 0.16 + S, 0.200, 0.026)));
  rb = Math.max(rb, cov(slimb(ax, ay, cx - 0.042, cy + 0.100, 0.05 + S, 0.210, 0.033)));
  rb = Math.max(rb, cov(slimb(ax, ay, cx + 0.042, cy + 0.100, -0.05 - S, 0.210, 0.033)));
  return rb;
}

function dither(canvas: HTMLCanvasElement, variant: Variant, t: number, tm = 0): void {
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(8, Math.round(rect.width));
  const H = Math.max(8, Math.round(rect.height));
  if (!W || !H) return;
  const px = variant === 'hero' ? 6 : 5;
  const w = Math.max(6, Math.floor(W / px));
  const h = Math.max(6, Math.floor(H / px));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const sand = variant === 'gold' ? GOLD : SAND;

  // robot silhouette state (hero: waving; puppet: pulling the sign's chain)
  let robotArr: Float32Array | null = null;
  let RB: RobotState | null = null;
  if (variant === 'hero') {
    robotArr = new Float32Array(w * h);
    const aspect = w / h;
    const wave = 0.46 * Math.sin(tm * 4.6);
    const bob = -0.012 * Math.cos(tm * 2.3);
    const sway = 0.014 * Math.sin(tm * 0.9);
    const cx = aspect * 0.66 + aspect * 0.02 * Math.sin(tm * 0.5);
    RB = { mode: 'hero', cx, cy: 0.5 + bob, wave, sway, aspect };
  } else if (variant === 'puppet') {
    robotArr = new Float32Array(w * h);
    const aspect = w / h;
    const local = ((tm % 3) + 3) % 3; // 3s pull cycle
    let pull = 0;
    if (local < 0.16) pull = local / 0.16;
    else if (local < 0.46) pull = 1 - (local - 0.16) / 0.30;
    pull = Math.max(0, Math.min(1, pull));
    pull = pull * pull * (3 - 2 * pull);
    const sway = 0.012 * Math.sin(tm * 0.9);
    const cx = aspect * 0.5 - 0.005;
    const cy = 0.70 + pull * 0.025;
    const armLen = 0.30 - pull * 0.15;
    const handY = cy - 0.115 - armLen;
    RB = { mode: 'puppet', cx, cy, sway, aspect, handY, chx: cx + 0.055, chy: handY };
  }

  const field = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w, ny = y / h;
      let v = 0;
      if (variant === 'hero') {
        const dx = nx - 0.66, dy = ny - 0.46;
        v = 1.12 - Math.sqrt(dx * dx * 0.9 + dy * dy * 1.7) * 1.7;
        const dx2 = nx - 0.4, dy2 = ny - 0.78;
        v = Math.max(v, 0.95 - Math.sqrt(dx2 * dx2 * 1.3 + dy2 * dy2 * 2.2) * 2.1);
        v += 0.14 * Math.sin(nx * 9 + Math.sin(ny * 5) * 1.6);
      } else if (variant === 'orb') {
        const dx = nx - 0.5, dy = ny - 0.44;
        v = 1.1 - Math.sqrt(dx * dx * 1.1 + dy * dy * 1.5) * 2.0;
        v *= 0.82 + 0.18 * Math.sin(ny * h * 0.5);
      } else if (variant === 'puppet') {
        const dx = nx - 0.5, dy = ny - 0.34;
        v = 0.98 - Math.sqrt(dx * dx * 1.0 + dy * dy * 1.35) * 1.7;
        v += 0.09 * Math.sin(ny * h * 0.42);
      } else if (variant === 'ridge') {
        v = 0.55 + 0.5 * Math.sin(nx * 6.283 * 1.4 + Math.sin(ny * 4.5) * 1.6) * (1.15 - ny);
      } else {
        const dx = nx - 0.5, dy = ny - 0.5;
        v = 1.0 - Math.sqrt(dx * dx + dy * dy) * 2.1;
      }
      // flowing + waving motion, breathing pulse, grain
      v += 0.10 * Math.sin(nx * 7.0 - ny * 3.5 + tm * 1.05)
         + 0.07 * Math.sin(nx * 4.0 + ny * 6.0 - tm * 0.85)
         + 0.05 * Math.sin(ny * 12.0 + tm * 1.8);
      v += 0.05 * Math.sin(tm * 1.3);
      v += (hash(x, y) - 0.5) * 0.08;

      if (RB && robotArr) {
        const ax = nx * RB.aspect, ay = ny;
        const rb = RB.mode === 'puppet' ? robotPuppet(RB, ax, ay) : robotHero(RB, ax, ay);
        let rcode = 0;
        if (rb > 0) {
          v -= rb * 0.95; // carve a shadowed silhouette
          rcode = 1;
          if (rb > 0.12 && rb < 0.52) rcode = 4; // glowing rim
        }
        const eyeDx = RB.mode === 'puppet' ? 0.024 : 0.026;
        const eye = cov(sbox(ax, ay, RB.cx + eyeDx, RB.cy - 0.205, 0.018, 0.014));
        const chest = cov(sbox(ax, ay, RB.cx, RB.cy - 0.010, 0.030, 0.045));
        if (eye > 0.5) rcode = 2;
        else if (chest > 0.5 && rb > 0.5) rcode = 3;
        if (RB.mode === 'puppet') {
          // pull-chain: sign centre → (moved) hand
          const x1 = RB.aspect * 0.5, y1 = 0.235, x2 = RB.chx ?? 0, y2 = (RB.chy ?? 0) + 0.01;
          const ddx = x2 - x1, ddy = y2 - y1, l2 = ddx * ddx + ddy * ddy;
          let tt = l2 > 0 ? ((ax - x1) * ddx + (ay - y1) * ddy) / l2 : 0;
          tt = Math.max(0, Math.min(1, tt));
          if (Math.hypot(ax - (x1 + tt * ddx), ay - (y1 + tt * ddy)) < 0.007) rcode = 5;
        }
        robotArr[y * w + x] = rcode;
      }
      field[y * w + x] = v;
    }
  }

  // vertical drip streaks — the signature "developing" bleed
  for (let x = 0; x < w; x++) {
    const cn = hash(x, 7.3);
    const decay = 0.9 + cn * 0.075;
    let run = 0;
    const puppet = RB?.mode === 'puppet';
    for (let y = 0; y < h; y++) {
      const i = y * w + x;
      if (puppet && robotArr && robotArr[i]! > 0) {
        run = 0;
        if (robotArr[i] === 1) field[i] = -1;
        continue;
      }
      const base = field[i]!;
      run = Math.max(base, run * decay - 0.01 - cn * 0.02);
      const flowmod = 0.78 + 0.22 * Math.sin(y * 0.55 - tm * 3.0 + cn * 6.28);
      const drip = run * (0.35 + 0.65 * t) * flowmod;
      field[i] = Math.max(base, drip * 0.96);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const v = field[idx]!;
      const thr = (BAYER[y & 3]![x & 3]! + 0.5) / 16;
      let on = v > thr;
      let c: [number, number, number] = on ? (sand as [number, number, number]) : INK;
      if (robotArr) {
        const rv = robotArr[idx];
        if (rv === 2) { c = EYE; on = true; }
        else if (rv === 3 || rv === 4 || rv === 5) { c = GOLD; on = true; }
      }
      const i = idx * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = on ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  canvas.style.imageRendering = 'pixelated';
}

/** Boot the dither system for every canvas[data-dither] on the page. */
export function initDither(): void {
  const canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>('canvas[data-dither]'),
  );
  if (!canvases.length) return;

  const variantOf = (c: HTMLCanvasElement) => (c.getAttribute('data-dither') || 'orb') as Variant;
  const hero = canvases.find((c) => c.dataset.hero);

  const heroT = () => {
    const sc = window.scrollY || 0;
    return 0.25 + 0.75 * Math.max(0, Math.min(1, 1 - sc / 700));
  };

  const paintAll = (tm: number) => {
    const vh = window.innerHeight || 800;
    for (const c of canvases) {
      const r = c.getBoundingClientRect();
      if (r.width < 4 || r.bottom < -60 || r.top > vh + 60) continue;
      dither(c, variantOf(c), c.dataset.hero ? heroT() : 1, tm);
    }
  };

  // initial paint (retry until laid out)
  let tries = 0;
  const first = () => {
    const ready = canvases.every((c) => c.getBoundingClientRect().width > 0);
    if (!ready && tries++ < 30) return void setTimeout(first, 50);
    paintAll(0);
  };
  first();

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  const signTick = (tm: number) => {
    const idx = Math.floor(tm / 3) % 5;
    window.dispatchEvent(new CustomEvent('sondri:pull', { detail: { idx } }));
  };

  if (!reduce) {
    let last = 0;
    const loop = (now: number) => {
      requestAnimationFrame(loop);
      if (now - last < 33) return; // ~30fps
      last = now;
      const tm = (now - t0) / 1000;
      signTick(tm);
      paintAll(tm);
    };
    requestAnimationFrame(loop);
  } else {
    // reduced motion: static frame; keep the neon sign cycling phrases
    let i = 0;
    setInterval(() => {
      i = (i + 1) % 5;
      window.dispatchEvent(new CustomEvent('sondri:pull', { detail: { idx: i } }));
    }, 3000);
    if (hero) {
      window.addEventListener(
        'scroll',
        () => dither(hero, 'hero', heroT(), 0),
        { passive: true },
      );
    }
  }

  window.addEventListener('resize', () => paintAll((performance.now() - t0) / 1000));
}
