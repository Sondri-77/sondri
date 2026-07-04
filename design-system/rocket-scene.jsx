// rocket-scene.jsx — FIRST-PERSON / over-the-shoulder rocket flight.
// The viewer rides the rocket: solar system rushes toward camera, stars streak
// past, the rocket's rear + engine plume sit in the foreground and bank into
// turns. Fake-3D perspective projection. Seamless 18s loop.
// On-brand Sondri palette: #1C1812 / gold #C7A56B / cream #EADFC5, mono HUD.

const TAU = Math.PI * 2;
const mod = (a, n) => ((a % n) + n) % n;
const clampv = (v, a, b) => Math.max(a, Math.min(b, v));

const FOC = 680;     // focal length
const ZMAX = 900;    // far plane
const VEL = 100;     // travel speed (VEL*18 = 2*ZMAX -> seamless)

// ── deterministic 3D starfield ─────────────────────────────────────────────
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _r = mulberry(20240627);
const STARS = Array.from({ length: 150 }, () => ({
  x: (_r() * 2 - 1) * 1250,
  y: (_r() * 2 - 1) * 1250,
  z0: 6 + _r() * ZMAX,
  size: 0.8 + _r() * 2.0,
  warm: _r() > 0.5,
}));

// planets: world offset from flight axis, start depth, size, look
const PLANETS = [
  { x: -360, y: 150, z0: 760, r: 72, fill: '#C2AB7E' },
  { x: 330, y: -120, z0: 470, r: 104, fill: '#8C8A7C', ring: true },
  { x: -150, y: -250, z0: 200, r: 60, fill: '#6E5A38', rim: '#C7A56B' },
];

function Planet3D({ X, Y, r, fill, rim, ring, op }) {
  return (
    <g opacity={op}>
      {ring && (
        <ellipse cx={X} cy={Y} rx={r * 2.15} ry={r * 0.7}
          transform={`rotate(-18 ${X} ${Y})`}
          fill="none" stroke="#C7A56B" strokeWidth={Math.max(1.5, r * 0.05)} opacity="0.6" />
      )}
      <circle cx={X} cy={Y} r={r} fill={fill} />
      <circle cx={X} cy={Y} r={r} fill="url(#sphereShade)" />
      <circle cx={X - r * 0.32} cy={Y - r * 0.34} r={r * 0.5} fill="#FBF3DC" opacity="0.10" />
      {rim && <circle cx={X} cy={Y} r={r} fill="none" stroke={rim} strokeWidth="1.5" opacity="0.55" />}
    </g>
  );
}

// rear / over-the-shoulder rocket in the foreground (does NOT roll with world)
function RocketRear({ cx, cy, bank, flick }) {
  const PL = 250 * flick;     // plume length
  const IPL = 150 * flick;    // inner plume
  const plume = `M-38,74 Q-58,${74 + PL * 0.5} -20,${74 + PL} Q0,${74 + PL * 1.18} 20,${74 + PL} Q58,${74 + PL * 0.5} 38,74 Z`;
  const inner = `M-22,78 Q-30,${78 + IPL * 0.5} -10,${78 + IPL} Q0,${78 + IPL * 1.1} 10,${78 + IPL} Q30,${78 + IPL * 0.5} 22,78 Z`;
  return (
    <g transform={`translate(${cx},${cy}) rotate(${bank})`} style={{ willChange: 'transform' }}>
      {/* engine plume toward camera */}
      <ellipse cx="0" cy={120} rx={70} ry={150 * flick} fill="url(#plumeGlow)" opacity="0.5" />
      <path d={plume} fill="url(#flameMain)" />
      <path d={inner} fill="url(#flameCore)" />
      {/* side fins */}
      <path d="M-44,64 L-104,150 L-34,6 Z" fill="#A8894F" />
      <path d="M44,64 L104,150 L34,6 Z" fill="#A8894F" />
      {/* body (rear, tapering away to nose) */}
      <path d="M-22,-156 L22,-156 L44,72 L-44,72 Z" fill="url(#bodyCyl)" />
      {/* gold bands */}
      <path d="M-26,-110 L26,-110 L29,-86 L-29,-86 Z" fill="#C7A56B" opacity="0.9" />
      <path d="M-39,30 L39,30 L42,54 L-42,54 Z" fill="#C7A56B" opacity="0.85" />
      {/* nose tip (far) */}
      <path d="M-22,-156 Q0,-188 22,-156 Z" fill="#C7A56B" />
      {/* engine nozzles (near) */}
      <ellipse cx="-20" cy={74} rx="15" ry="9" fill="#1C1812" />
      <ellipse cx="20" cy={74} rx="15" ry="9" fill="#1C1812" />
      <ellipse cx="-20" cy={74} rx="15" ry="9" fill="none" stroke="#C7A56B" strokeWidth="2" />
      <ellipse cx="20" cy={74} rx="15" ry="9" fill="none" stroke="#C7A56B" strokeWidth="2" />
      <ellipse cx="-20" cy={75} rx="7" ry="4" fill="#F4E3B4" opacity={0.8 * flick} />
      <ellipse cx="20" cy={75} rx="7" ry="4" fill="#F4E3B4" opacity={0.8 * flick} />
    </g>
  );
}

function Scene({ W, H, D }) {
  const t = useTime();
  const loop = (t % D) / D;

  // camera yaw/pitch (vanishing point drift) + roll (bank) — all seamless
  const vx = W / 2 + 150 * Math.sin(TAU * loop);
  const vy = H * 0.44 + 56 * Math.sin(2 * TAU * loop + 0.6);
  const rollDeg = 7 * Math.sin(TAU * loop);

  const proj = (x, y, z) => { const s = FOC / z; return { X: vx + x * s, Y: vy + y * s, s }; };

  // sun — large, far, near the flight axis; subtle approach/recede
  const sunZ = 1500 + 240 * Math.sin(TAU * loop);
  const sun = proj(120, -30, sunZ);
  const sunR = 600 * (FOC / sunZ);

  // stars (streaking)
  const stars = STARS.map((st) => {
    const z = clampv(mod(st.z0 - VEL * t, ZMAX), 4, ZMAX);
    const streakZ = clampv((ZMAX - z) * 0.16 + 12, 12, 150);
    const a = proj(st.x, st.y, z);
    const b = proj(st.x, st.y, z + streakZ);
    const op = clampv((ZMAX - z) / ZMAX * 1.25, 0, 1);
    const w = clampv(st.size * (FOC / z) * 0.9, 0.5, 3.2);
    return { a, b, op, w, warm: st.warm };
  });

  // planets (sorted far -> near)
  const planets = PLANETS.map((p) => {
    const z = mod(p.z0 - VEL * t, ZMAX);
    const a = proj(p.x, p.y, z);
    const op = Math.min(clampv((z - 110) / 90, 0, 1), clampv((ZMAX - z) / 110, 0, 1));
    return { ...p, X: a.X, Y: a.Y, R: p.r * (FOC / z), op, z };
  }).filter(p => p.op > 0.01).sort((a, b) => b.z - a.z);

  const flick = 1 + 0.18 * Math.sin(t * 33) + 0.1 * Math.sin(t * 61 + 1);

  // HUD numbers
  const vel = Math.round(48200 + 5400 * Math.sin(TAU * loop + 1));
  const velStr = vel.toLocaleString('en-US');
  const alt = (3.18 + 0.6 * Math.sin(TAU * loop)).toFixed(2);

  return (
    <React.Fragment>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBF1D6" />
            <stop offset="18%" stopColor="#E7CC93" />
            <stop offset="42%" stopColor="#C7A56B" stopOpacity="0.5" />
            <stop offset="72%" stopColor="#C7A56B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#C7A56B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunCore" cx="42%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#FCF3DC" />
            <stop offset="52%" stopColor="#ECD79E" />
            <stop offset="100%" stopColor="#CBA968" />
          </radialGradient>
          <radialGradient id="sphereShade" cx="66%" cy="66%" r="78%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="vign" cx="50%" cy="46%" r="62%">
            <stop offset="58%" stopColor="#1C1812" stopOpacity="0" />
            <stop offset="100%" stopColor="#0E0B06" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="plumeGlow" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#F4E3B4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C7A56B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyCyl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A7345" />
            <stop offset="20%" stopColor="#EADFC5" />
            <stop offset="50%" stopColor="#FBF3DC" />
            <stop offset="80%" stopColor="#E4D8BC" />
            <stop offset="100%" stopColor="#7E6A3E" />
          </linearGradient>
          <linearGradient id="flameMain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF3D2" stopOpacity="1" />
            <stop offset="38%" stopColor="#F0C97A" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#C7A56B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flameCore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FBE6AE" stopOpacity="0" />
          </linearGradient>
          <pattern id="dither" width="13" height="13" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="2.4" height="2.4" fill="#7E715A" />
          </pattern>
        </defs>

        {/* static texture behind the moving world */}
        <rect x="0" y="0" width={W} height={H} fill="url(#dither)" opacity="0.06" />

        {/* world — rolls with the bank */}
        <g transform={`rotate(${rollDeg} ${vx} ${vy})`}>
          {/* sun ahead */}
          <circle cx={sun.X} cy={sun.Y} r={sunR * 2.6} fill="url(#sunGlow)" />
          <circle cx={sun.X} cy={sun.Y} r={sunR} fill="url(#sunCore)" />
          <circle cx={sun.X} cy={sun.Y} r={sunR} fill="none" stroke="#FBF1D6" strokeWidth="1.5" opacity="0.4" />

          {/* streaking stars */}
          {stars.map((s, i) => (
            <line key={i} x1={s.a.X} y1={s.a.Y} x2={s.b.X} y2={s.b.Y}
              stroke={s.warm ? '#C7A56B' : '#EADFC5'} strokeWidth={s.w}
              strokeLinecap="round" opacity={s.op} />
          ))}

          {/* planets rushing past */}
          {planets.map((p, i) => (
            <Planet3D key={i} X={p.X} Y={p.Y} r={p.R} fill={p.fill} rim={p.rim} ring={p.ring} op={p.op} />
          ))}

          <rect x="0" y="0" width={W} height={H} fill="url(#vign)" />
        </g>

        {/* foreground rocket — steady frame, banks gently */}
        <RocketRear cx={W / 2 + 8 * Math.sin(TAU * loop)} cy={H * 0.78} bank={-rollDeg * 1.5} flick={flick} />
      </svg>

      {/* ── cockpit HUD ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* viewfinder corners */}
        {[
          { top: 40, left: 40, bt: 1, bl: 1 }, { top: 40, right: 40, bt: 1, br: 1 },
          { bottom: 40, left: 40, bb: 1, bl: 1 }, { bottom: 40, right: 40, bb: 1, br: 1 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: 26, height: 26,
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            borderTop: c.bt ? '1px solid rgba(199,165,107,0.5)' : 'none',
            borderBottom: c.bb ? '1px solid rgba(199,165,107,0.5)' : 'none',
            borderLeft: c.bl ? '1px solid rgba(199,165,107,0.5)' : 'none',
            borderRight: c.br ? '1px solid rgba(199,165,107,0.5)' : 'none',
          }} />
        ))}

        {/* heading reticle at vanishing point */}
        <div style={{ position: 'absolute', left: vx, top: vy, transform: 'translate(-50%,-50%)' }}>
          <div style={{ position: 'absolute', left: '-50%', top: '50%', width: 64, height: 64, transform: 'translate(-32px,-32px)', border: '1px solid rgba(199,165,107,0.35)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', width: 22, height: 1, background: 'rgba(199,165,107,0.6)', transform: 'translate(-50%,0)' }} />
          <div style={{ position: 'absolute', width: 1, height: 22, background: 'rgba(199,165,107,0.6)', transform: 'translate(0,-50%)' }} />
        </div>

        <div style={{ position: 'absolute', top: 54, left: 70, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 26, height: 1, background: '#C7A56B' }} />
          <span style={{ ...mono, fontSize: 14, letterSpacing: 4, color: '#C7A56B' }}>SONDRI &nbsp;&mdash;&nbsp; FLIGHT OPS</span>
        </div>
        <div style={{ position: 'absolute', top: 78, left: 108, ...mono, fontSize: 11, letterSpacing: 3, color: '#7E715A' }}>FIRST&#8209;PERSON &middot; LIVE</div>

        <div style={{ position: 'absolute', top: 54, right: 70, textAlign: 'right' }}>
          <div style={{ ...mono, fontSize: 12, letterSpacing: 3, color: '#7E715A' }}>HEADING &middot; SOL</div>
          <div style={{ ...mono, fontSize: 20, letterSpacing: 1, color: '#EADFC5', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            V {velStr} <span style={{ fontSize: 12, color: '#9E9075' }}>KM/H</span>
          </div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: 2, color: '#7E715A', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            ALT {alt} AU
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 56, left: 70 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: 1, color: '#EADFC5' }}>
            0 <span style={{ color: '#C7A56B' }}>&rarr;</span> 1 <span style={{ color: '#C7A56B' }}>&rarr;</span> n
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: 58, right: 70, ...mono, fontSize: 12, letterSpacing: 3, color: '#7E715A' }}>
          AI, DEPLOYED WHERE THE WORK HAPPENS
        </div>
      </div>
    </React.Fragment>
  );
}

const mono = { fontFamily: "'Space Mono', monospace" };

function RocketHero(props) {
  const W = +props.width || 1920;
  const H = +props.height || 1080;
  const D = +props.duration || 18;
  return (
    <Stage width={W} height={H} duration={D} background="#1C1812" persistKey="rockethero">
      <Scene W={W} H={H} D={D} />
    </Stage>
  );
}

window.RocketHero = RocketHero;
