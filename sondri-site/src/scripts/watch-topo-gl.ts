/* Fixed pixelated Bayer-dithered WebGL horizon & signal sky for watch.sondri.ai.
   Inspired by layered Andean mountain ridges + signal starfield rendered through
   an ordered 4x4 Bayer dithering matrix in Sondri's exact dark-teal palette
   (#031919 -> #081f1f -> #0c2827 -> #173f3c -> #285e59) with warm #fdb343 gold
   dithered ridge crests and sparse signal nodes. Parallax-pans smoothly on scroll. */

const VERT_SRC = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;

// 4x4 ordered Bayer threshold matrix normalized to [0, 1)
float bayer4x4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = y * 4 + x;
  if (idx == 0)  return 0.0 / 16.0;
  if (idx == 1)  return 8.0 / 16.0;
  if (idx == 2)  return 2.0 / 16.0;
  if (idx == 3)  return 10.0 / 16.0;
  if (idx == 4)  return 12.0 / 16.0;
  if (idx == 5)  return 4.0 / 16.0;
  if (idx == 6)  return 14.0 / 16.0;
  if (idx == 7)  return 6.0 / 16.0;
  if (idx == 8)  return 3.0 / 16.0;
  if (idx == 9)  return 11.0 / 16.0;
  if (idx == 10) return 1.0 / 16.0;
  if (idx == 11) return 9.0 / 16.0;
  if (idx == 12) return 15.0 / 16.0;
  if (idx == 13) return 7.0 / 16.0;
  if (idx == 14) return 13.0 / 16.0;
  return 5.0 / 16.0;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.02 + vec2(5.13, 2.71);
    amp *= 0.5;
  }
  return v;
}

float ridgeHeight(float x, float freq, float seed, float speed) {
  float n = fbm(vec2(x * freq + seed + uTime * speed, seed * 0.7));
  float crest = 1.0 - abs(n * 2.0 - 1.0);
  return crest * 0.65 + n * 0.35;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / max(uRes, vec2(1.0));
  float aspect = uRes.x / max(uRes.y, 1.0);
  float b = bayer4x4(frag);

  // Subtle radial pointer signal
  vec2 mDelta = (uv - uMouse) * vec2(aspect, 1.0);
  float mouseGlow = exp(-dot(mDelta, mDelta) * 9.0) * 0.14;

  // Vertical scroll parallax shifts horizon gently without distracting text
  float parFar = uScroll * 0.08;
  float parMid = uScroll * 0.15;
  float parNear = uScroll * 0.24;

  // 3 parallax mountain ridge profiles in lower 58%
  float xCoord = uv.x * aspect;
  float rFar  = 0.26 + ridgeHeight(xCoord + uScroll * 0.28, 1.35, 1.7, 0.008) * 0.32 - parFar;
  float rMid  = 0.18 + ridgeHeight(xCoord + uScroll * 0.45, 1.85, 4.3, 0.012) * 0.25 - parMid;
  float rNear = 0.09 + ridgeHeight(xCoord + uScroll * 0.68, 2.45, 8.9, 0.016) * 0.19 - parNear;

  // Star & signal nodes in upper sky
  vec2 starCell = floor(frag / 4.0);
  float starRand = hash21(starCell + vec2(floor(uScroll * 2.0), 0.0));
  float twinkle = 0.6 + 0.4 * sin(uTime * 1.3 + starRand * 32.0);
  float isStar = step(0.992, starRand) * smoothstep(0.28, 0.75, uv.y) * twinkle;
  float isGoldStar = step(0.9965, starRand) * smoothstep(0.35, 0.85, uv.y) * twinkle;

  // Exact Sondri palette
  vec3 cSky0 = vec3(3.0, 25.0, 25.0) / 255.0;     // #031919 deepest obsidian teal
  vec3 cSky1 = vec3(8.0, 31.0, 31.0) / 255.0;     // #081f1f slate teal
  vec3 cFar  = vec3(12.0, 40.0, 39.0) / 255.0;    // #0c2827 far ridge
  vec3 cMid  = vec3(23.0, 63.0, 60.0) / 255.0;    // #173f3c mid ridge
  vec3 cNear = vec3(40.0, 94.0, 89.0) / 255.0;    // #285e59 near ridge
  vec3 cGold = vec3(253.0, 179.0, 67.0) / 255.0;  // #fdb343 warm gold crest

  // Sky dithering gradient toward horizon
  float skyGrad = clamp((1.0 - uv.y) * 0.42 + mouseGlow, 0.0, 1.0);
  vec3 col = (skyGrad + (b - 0.5) * 0.22 > 0.28) ? cSky1 : cSky0;

  // Far mountain layer with dithered soft transition near crest
  float dFar = rFar - uv.y;
  if (dFar > -0.025) {
    float edgeMask = smoothstep(-0.025, 0.035, dFar) + mouseGlow * 0.4;
    if (edgeMask + (b - 0.5) * 0.35 > 0.5) {
      col = cFar;
    }
    // Sparse gold horizon glint on far ridge top
    if (abs(dFar) < 0.008 && (b < 0.18 + mouseGlow * 0.4)) {
      col = mix(cMid, cGold, 0.58);
    }
  }

  // Mid mountain layer with internal contour dither
  float dMid = rMid - uv.y;
  if (dMid > -0.02) {
    float bandMid = smoothstep(-0.02, 0.03, dMid) - clamp(dMid * 1.4, 0.0, 0.35);
    if (bandMid + (b - 0.5) * 0.36 > 0.46) {
      col = cMid;
    }
  }

  // Near mountain layer
  float dNear = rNear - uv.y;
  if (dNear > -0.018) {
    float shade = smoothstep(-0.018, 0.025, dNear) + fbm(vec2(xCoord * 3.5, uv.y * 8.0)) * 0.18;
    if (shade + (b - 0.5) * 0.38 > 0.52) {
      col = cNear;
    } else if (dNear > 0.0) {
      col = cMid;
    }
    if (abs(dNear) < 0.006 && b < 0.22) {
      col = mix(cNear, cGold, 0.65);
    }
  }

  // Paint crisp star/signal pixels strictly above ridges
  if (uv.y > rFar + 0.02) {
    if (isGoldStar > 0.35) {
      col = mix(cSky1, cGold, 0.85);
    } else if (isStar > 0.35) {
      col = mix(cSky1, vec3(95.0, 196.0, 188.0) / 255.0, 0.45);
    }
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export function initWatchTopoBackground(canvasId = 'watch-topo-canvas') {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pixelScale = 1 / 3.4;

  let scrollNorm = 0;
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollNorm = Math.min(1, Math.max(0, window.scrollY / max));
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  let mouseX = 0.5;
  let mouseY = 0.5;
  window.addEventListener(
    'pointermove',
    (e) => {
      mouseX = e.clientX / Math.max(1, window.innerWidth);
      mouseY = 1 - e.clientY / Math.max(1, window.innerHeight);
    },
    { passive: true },
  );

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });

  if (!gl) {
    // Graceful 2D fallback using the same Bayer palette if WebGL is disabled
    const ctx2d = canvas.getContext('2d', { alpha: false });
    if (!ctx2d) return;
    const drawFallback = () => {
      const w = Math.max(120, Math.round(window.innerWidth * pixelScale));
      const h = Math.max(90, Math.round(window.innerHeight * pixelScale));
      canvas.width = w;
      canvas.height = h;
      ctx2d.fillStyle = '#031919';
      ctx2d.fillRect(0, 0, w, h);
      ctx2d.fillStyle = '#143432';
      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) {
          const wave = Math.sin(x * 0.04 + y * 0.03 + scrollNorm * 4.0);
          if (wave > 0.72) ctx2d.fillRect(x, y, 2, 2);
        }
      }
    };
    drawFallback();
    window.addEventListener('resize', drawFallback, { passive: true });
    return;
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  if (!prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uScroll = gl.getUniformLocation(prog, 'uScroll');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  const resize = () => {
    const w = Math.max(160, Math.round(window.innerWidth * pixelScale));
    const h = Math.max(120, Math.round(window.innerHeight * pixelScale));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let smoothScroll = scrollNorm;
  let raf = 0;
  let start = performance.now();

  const render = (now: number) => {
    raf = 0;
    const elapsed = (now - start) * 0.001;
    smoothScroll += (scrollNorm - smoothScroll) * 0.14;
    gl.uniform1f(uTime, reduceMotion ? 0 : elapsed);
    gl.uniform1f(uScroll, smoothScroll);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduceMotion && !document.hidden) {
      raf = requestAnimationFrame(render);
    }
  };

  render(start);
  if (!reduceMotion) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !raf) {
        raf = requestAnimationFrame(render);
      }
    });
  }
}
