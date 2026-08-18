/* Glyph field — a motion.dev-style ASCII gradient in Sondri colors.
   A grid of monospace glyphs whose direction, weight, and color follow a
   flowing pseudo-noise field; the cursor locally excites the flow. Rendered
   from a pre-baked sprite atlas so each frame is drawImage-only.
   Static single frame under reduced motion; pauses off-screen and on
   hidden tabs. */

const STOPS = ['#174040', '#6A8988', '#AAC2C2', '#E6F2F0', '#FDB343', '#F5A71E'];
const COLORS = 40; // interpolated palette size
const GLYPHS = ['·', '/', '–', '\\', '|', '=', '+'];
const CELL = 14; // px per grid cell
const FPS = 30;

function buildPalette(): string[] {
  const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgb = STOPS.map(hex);
  const out: string[] = [];
  for (let i = 0; i < COLORS; i++) {
    // Ping-pong across the stops so the gradient cycles without a hard seam.
    const t = (i / COLORS) * 2;
    const u = t > 1 ? 2 - t : t;
    const f = u * (rgb.length - 1);
    const a = rgb[Math.floor(f)];
    const b = rgb[Math.min(Math.floor(f) + 1, rgb.length - 1)];
    const k = f - Math.floor(f);
    out.push(
      `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`,
    );
  }
  return out;
}

export function initGlyphFields(animate: boolean) {
  document
    .querySelectorAll<HTMLCanvasElement>('canvas.glyph-field')
    .forEach((cv) => initOne(cv, animate));
}

function initOne(cv: HTMLCanvasElement, animate: boolean) {
  const hero = cv.closest('section');
  if (!hero) return;
  const context = cv.getContext('2d');
  if (!context) return;
  const ctx = context;
  const calm = cv.dataset.variant === 'calm';
  const ALPHA = calm ? 0.62 : 1; // calm variant: quieter presence on inner pages
  const SPEED = calm ? 0.75 : 1;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const palette = buildPalette();

  // Sprite atlas: one tile per (glyph, color).
  const CW = CELL * dpr;
  const CH = CELL * dpr;
  const atlas = document.createElement('canvas');
  atlas.width = GLYPHS.length * CW;
  atlas.height = COLORS * CH;
  const actx = atlas.getContext('2d')!;
  actx.font = `${11 * dpr}px ui-monospace, Menlo, monospace`;
  actx.textAlign = 'center';
  actx.textBaseline = 'middle';
  for (let g = 0; g < GLYPHS.length; g++) {
    for (let c = 0; c < COLORS; c++) {
      actx.fillStyle = palette[c];
      actx.fillText(GLYPHS[g], g * CW + CW / 2, c * CH + CH / 2);
    }
  }

  let W = 0, H = 0, cols = 0, rows = 0;
  const resize = () => {
    W = hero.clientWidth;
    H = hero.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    cols = Math.ceil(W / CELL);
    rows = Math.ceil(H / CELL);
    draw(last);
  };

  // Pointer excitement (lerped toward the real cursor each frame).
  const ptr = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, heat: 0, target: 0 };
  hero.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    ptr.tx = e.clientX - r.left;
    ptr.ty = e.clientY - r.top;
    ptr.target = 1;
  });
  hero.addEventListener('pointerleave', () => { ptr.target = 0; });

  const SIGMA = calm ? 120 : 150; // cursor influence radius, px
  let last = 0;

  function draw(t: number) {
    const time = (t / 1000) * SPEED;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ptr.x += (ptr.tx - ptr.x) * 0.14;
    ptr.y += (ptr.ty - ptr.y) * 0.14;
    ptr.heat += (ptr.target - ptr.heat) * 0.06;

    for (let gy = 0; gy < rows; gy++) {
      const y = gy * CELL + CELL / 2;
      for (let gx = 0; gx < cols; gx++) {
        const x = gx * CELL + CELL / 2;

        // Flow field: layered sines, drifting with time.
        let v =
          (Math.sin(x * 0.011 + time * 0.55) +
            Math.sin(y * 0.017 - time * 0.38) +
            Math.sin((x + y) * 0.008 + time * 0.22)) / 3;

        // Cursor: local excitement raises intensity and bends the flow.
        const dx = x - ptr.x, dy = y - ptr.y;
        const infl = ptr.heat * Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
        v += infl * 0.9;

        // Direction → glyph; calm cells fall back to the quiet dot.
        const mag = Math.abs(v);
        let g: number;
        if (infl > 0.45) g = 6; // '+' sparkles under the cursor
        else if (mag < 0.14) g = 0; // '·'
        else {
          const ang = ((v * Math.PI) % Math.PI + Math.PI) % Math.PI;
          g = 1 + (Math.floor((ang / Math.PI) * 4 + 0.5) % 4);
          if (mag > 0.82) g = 5; // '=' where the flow runs strongest
        }

        // Color: gradient bands that drift with the flow.
        const c =
          ((Math.floor((x * 0.55 + y * 0.35 + v * 120 + time * 26) / 9) % COLORS) + COLORS) % COLORS;

        ctx.globalAlpha = Math.min(0.28 + mag * 0.5 + infl * 0.35, 0.95) * ALPHA;
        ctx.drawImage(atlas, g * CW, c * CH, CW, CH, gx * CELL * dpr, gy * CELL * dpr, CW, CH);
      }
    }
    ctx.globalAlpha = 1;
  }

  let raf = 0;
  let running = false;
  let visible = true;
  const loop = (t: number) => {
    if (!running) return;
    if (t - last >= 1000 / FPS) {
      last = t;
      draw(t);
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || !animate || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  new ResizeObserver(resize).observe(hero);
  resize();

  if (animate) {
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });
    start();
  }
}
