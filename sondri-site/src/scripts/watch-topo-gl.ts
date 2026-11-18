/* Fixed pixelated Bayer-dithered WebGL topographical background for watch.sondri.ai.
   Uses Sondri's exact dark-teal ramp (#031919 -> #081f1f -> #1a403e -> #2f5b58)
   plus sparse #fdb343 gold elevation contour crests quantized through a 4x4
   ordered Bayer matrix at coarse pixel resolution (`image-rendering: pixelated`).
   Pans gently with scroll progress (`uScroll`) and pauses when hidden or when
   `prefers-reduced-motion: reduce` is enabled. */

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
    p = p * 2.03 + vec2(7.13, 3.71);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / max(uRes, vec2(1.0));
  float aspect = uRes.x / max(uRes.y, 1.0);

  // Pan topography vertically with scroll and drift slowly over time
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.25;
  p.y -= uScroll * 1.45;
  p.x += uTime * 0.018;
  p.y += uTime * 0.011;

  float h = fbm(p + vec2(fbm(p * 0.65 + uTime * 0.015), 0.0) * 0.45);

  // Contour bands (topographic iso-lines)
  float band = fract(h * 7.5);
  float contour = smoothstep(0.08, 0.0, abs(band - 0.5));

  // Subtle radial signal from pointer
  vec2 mDelta = (uv - uMouse) * vec2(aspect, 1.0);
  float mouseGlow = exp(-dot(mDelta, mDelta) * 14.0) * 0.16;

  float lum = clamp(h * 0.55 + contour * 0.24 + mouseGlow, 0.0, 1.0);
  float b = bayer4x4(frag);
  float dithered = clamp(lum + (b - 0.5) * 0.24, 0.0, 1.0);

  // 4-step Sondri dark teal palette + sparse gold crest on highest iso-contour
  vec3 c0 = vec3(3.0, 25.0, 25.0) / 255.0;     // #031919
  vec3 c1 = vec3(8.0, 31.0, 31.0) / 255.0;     // #081f1f
  vec3 c2 = vec3(20.0, 52.0, 50.0) / 255.0;    // #143432
  vec3 c3 = vec3(38.0, 82.0, 78.0) / 255.0;    // #26524e
  vec3 cGold = vec3(253.0, 179.0, 67.0) / 255.0; // #fdb343

  vec3 col = c0;
  if (dithered > 0.78 && contour > 0.55 && h > 0.64) {
    col = mix(c3, cGold, 0.72);
  } else if (dithered > 0.62) {
    col = c3;
  } else if (dithered > 0.36) {
    col = c2;
  } else if (dithered > 0.16) {
    col = c1;
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
