// The Sondri turntable: a brushed-black-titanium robot in a black void,
// sapphire visor, gold rim light, drifting gold dust — rendered through a
// Bayer-dither post shader so the 3D scene reads as the brand's pixel art.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface OrbitScene {
  render(progress: number, time: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

/* ─── procedural textures ────────────────────────────────────────────── */

/** Horizontal micro-streak map — reads as brushed metal under raking light. */
function brushedTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y++) {
    const v = 110 + Math.random() * 70;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.globalAlpha = 0.55;
    g.fillRect(0, y, 512, 1);
  }
  g.globalAlpha = 0.2;
  for (let i = 0; i < 240; i++) {
    const v = 80 + Math.random() * 120;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 40 + Math.random() * 180, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** Engraved SONDRI indices — used as emissive + bump on the face bezel band. */
function indicesTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 2048, 128);
  g.fillStyle = '#c89550';
  g.font = '700 44px "Space Mono", monospace';
  g.textBaseline = 'middle';
  const unit = 512;
  for (let i = 0; i < 4; i++) {
    const x = i * unit;
    g.fillText('SONDRI', x + 60, 64);
    g.font = '400 26px "Space Mono", monospace';
    g.fillText(`0${i + 1}`, x + 300, 64);
    g.font = '700 44px "Space Mono", monospace';
    // tick indices between wordmarks
    for (let tkx = 370; tkx < unit - 20; tkx += 34) {
      g.fillRect(x + tkx, 44, 3, 40);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ─── dither post shader ─────────────────────────────────────────────── */

const DITHER_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tSrc;
  uniform vec2 uRes;
  uniform float uTime;

  float bayer4(vec2 fc) {
    int x = int(mod(fc.x, 4.0));
    int y = int(mod(fc.y, 4.0));
    mat4 B = mat4(
       0.0, 12.0,  3.0, 15.0,
       8.0,  4.0, 11.0,  7.0,
       2.0, 14.0,  1.0, 13.0,
      10.0,  6.0,  9.0,  5.0
    );
    return (B[x][y] + 0.5) / 16.0;
  }

  void main() {
    vec2 fc = vUv * uRes;
    vec3 c = texture2D(tSrc, vUv).rgb;
    c = pow(c, vec3(0.4545));                                              // linear → sRGB
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    // faint vertical "developing" streaks — brand continuity with dither.ts
    float col = floor(fc.x);
    luma += 0.05 * sin(fc.y * 0.5 - uTime * 2.2 + col * 3.7) * smoothstep(0.0, 0.25, luma);
    float t = bayer4(fc);

    // 4-level ordered-dither ramp: the lighting gradient across the body
    // renders as graduated pixel density — this is what gives it depth.
    float v = clamp(luma * 2.7, 0.0, 0.999) * 3.0;
    float base = floor(v);
    float lvl = base + step(t, v - base);

    float warm = clamp((c.r - c.b) * 3.0, 0.0, 1.0);
    float cool = clamp((c.b - c.r) * 2.6, 0.0, 1.0);
    vec3 tint = mix(vec3(0.902, 0.949, 0.941), vec3(1.0, 0.8, 0.47), warm); // bone → gold
    tint = mix(tint, vec3(0.38, 0.58, 0.95), cool * 0.9);                   // sapphire reads blue

    vec3 L0 = vec3(0.031, 0.075, 0.075);                                    // ink void
    vec3 L1 = vec3(0.095, 0.165, 0.165);                                    // deep shadow
    vec3 L2 = mix(vec3(0.335, 0.455, 0.445), tint, 0.35);                   // half-tone
    vec3 L3 = tint;                                                         // full light
    vec3 outc = L0;
    outc = mix(outc, L1, step(0.5, lvl));
    outc = mix(outc, L2, step(1.5, lvl));
    outc = mix(outc, L3, step(2.5, lvl));
    gl_FragColor = vec4(outc, 1.0);
  }
`;

const DITHER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ─── robot ──────────────────────────────────────────────────────────── */

function buildRobot(): THREE.Group {
  const bot = new THREE.Group();
  const brushed = brushedTexture();

  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0x2a3238,
    metalness: 0.92,
    roughness: 0.42,
    roughnessMap: brushed,
    clearcoat: 0.25,
    clearcoatRoughness: 0.6,
    envMapIntensity: 1.15,
  });
  const titaniumDark = titanium.clone();
  titaniumDark.color = new THREE.Color(0x181d21);
  const gold = new THREE.MeshStandardMaterial({
    color: 0xffcc78,
    metalness: 1.0,
    roughness: 0.28,
    emissive: 0x543a12,
    emissiveIntensity: 0.35,
  });
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: 0x16324f,
    metalness: 0.1,
    roughness: 0.06,
    transmission: 0.65,
    thickness: 0.35,
    ior: 1.77,
    envMapIntensity: 1.4,
    transparent: true,
  });
  const indicesTex = indicesTexture();
  const bezel = new THREE.MeshStandardMaterial({
    color: 0x0b0e11,
    metalness: 0.85,
    roughness: 0.5,
    emissiveMap: indicesTex,
    emissive: 0xffcc78,
    emissiveIntensity: 0.9,
    bumpMap: indicesTex,
    bumpScale: 0.5,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff4dc });

  const rbox = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, r = 0.04) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, Math.min(w, h, d) / 2.01)), m);
    mesh.position.set(x, y, z);
    bot.add(mesh);
    return mesh;
  };
  const sphere = (r: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
    mesh.position.set(x, y, z);
    bot.add(mesh);
    return mesh;
  };
  const capsule = (r: number, len: number, m: THREE.Material, x: number, y: number, z: number, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), m);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    bot.add(mesh);
    return mesh;
  };

  // head + antenna
  rbox(0.44, 0.36, 0.36, titanium, 0, 0.66, 0, 0.06);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), titaniumDark);
  ant.position.set(0, 0.95, 0);
  bot.add(ant);
  sphere(0.03, gold, 0, 1.07, 0);

  // sapphire visor — curved band across the face
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.17, 48, 1, true, -0.62, 1.24),
    sapphire,
  );
  visor.material.side = THREE.DoubleSide;
  visor.position.set(0, 0.68, 0.02);
  bot.add(visor);

  // inner face + eyes behind the glass
  rbox(0.3, 0.18, 0.04, titaniumDark, 0, 0.68, 0.15, 0.02);
  const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.022), eyeMat);
  eyeL.position.set(-0.07, 0.69, 0.176);
  bot.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;
  bot.add(eyeR);

  // engraved SONDRI indices bezel, just below the visor
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.235, 0.055, 48, 1, true, -0.95, 1.9),
    bezel,
  );
  band.position.set(0, 0.545, 0.02);
  bot.add(band);

  // neck, torso, chest, core
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.09, 20), titaniumDark);
  neck.position.set(0, 0.45, 0);
  bot.add(neck);
  rbox(0.54, 0.6, 0.38, titanium, 0, 0.08, 0, 0.07);
  rbox(0.3, 0.34, 0.05, titaniumDark, 0, 0.12, 0.195, 0.02);
  rbox(0.1, 0.14, 0.02, gold, 0, 0.12, 0.225, 0.01);

  // hips
  rbox(0.4, 0.16, 0.32, titaniumDark, 0, -0.31, 0, 0.05);

  // shoulders (gold joints) + arms + hands
  sphere(0.09, gold, -0.34, 0.3, 0);
  sphere(0.09, gold, 0.34, 0.3, 0);
  capsule(0.065, 0.4, titanium, -0.37, 0.02, 0, 0.09);
  capsule(0.065, 0.4, titanium, 0.37, 0.02, 0, -0.09);
  sphere(0.075, titaniumDark, -0.4, -0.24, 0);
  sphere(0.075, titaniumDark, 0.4, -0.24, 0);

  // hip joints + legs + feet
  sphere(0.07, gold, -0.15, -0.4, 0);
  sphere(0.07, gold, 0.15, -0.4, 0);
  capsule(0.08, 0.46, titanium, -0.15, -0.7, 0);
  capsule(0.08, 0.46, titanium, 0.15, -0.7, 0);
  rbox(0.16, 0.08, 0.26, titaniumDark, -0.15, -1.0, 0.03, 0.03);
  rbox(0.16, 0.08, 0.26, titaniumDark, 0.15, -1.0, 0.03, 0.03);

  return bot;
}

/* ─── camera timeline ────────────────────────────────────────────────── */

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * p ∈ [0, 0.55]  — 360° studio turntable
 * p ∈ [0.55, 1]  — three macro "shots": shoulder dolly, visor glide, indices glide
 */
function cameraAt(p: number, cam: THREE.PerspectiveCamera, look: THREE.Vector3): void {
  let fov = 38;
  if (p <= 0.55) {
    const t = p / 0.55;
    const az = t * Math.PI * 2;
    const r = 3.6 - 0.2 * Math.sin(t * Math.PI);
    const y = 0.26 + 0.16 * Math.sin(t * Math.PI * 2);
    cam.position.set(Math.sin(az) * r, y, Math.cos(az) * r);
    look.set(0, 0.02, 0);
  } else if (p <= 0.7) {
    const t = smooth((p - 0.55) / 0.15);
    fov = lerp(38, 30, t);
    cam.position.set(lerp(0, 0.95, t), lerp(0.26, 0.52, t), lerp(3.6, 1.05, t));
    look.set(lerp(0, 0.34, t), lerp(0.02, 0.3, t), 0);
  } else if (p <= 0.85) {
    const t = smooth((p - 0.7) / 0.15);
    fov = 30;
    cam.position.set(lerp(0.6, -0.6, t), 0.76, 0.95);
    look.set(lerp(0.2, -0.2, t), 0.67, 0.1);
  } else {
    const t = smooth((p - 0.85) / 0.15);
    fov = 26;
    cam.position.set(lerp(-0.48, 0.48, t), lerp(0.58, 0.55, t), lerp(0.62, 0.58, t));
    look.set(lerp(-0.16, 0.16, t), 0.545, 0.08);
  }
  if (Math.abs(cam.fov - fov) > 0.01) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  cam.lookAt(look);
}

/* ─── scene assembly ─────────────────────────────────────────────────── */

export function createScene(canvas: HTMLCanvasElement): OrbitScene {
  const small = (window.innerWidth || 1200) < 700;
  const CELL = small ? 4 : 3;
  const PARTICLES = small ? 140 : 420;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  const lookTarget = new THREE.Vector3(0, 0.12, 0);

  // dramatic gold rim behind-left + cool bone rim behind-right + low warm key
  const rim = new THREE.DirectionalLight(0xffcc78, 9);
  rim.position.set(-2.2, 1.5, -2.4);
  scene.add(rim);
  const rimCool = new THREE.DirectionalLight(0xbfd6d2, 3);
  rimCool.position.set(2.6, 1.1, -1.8);
  scene.add(rimCool);
  const key = new THREE.DirectionalLight(0xffd9a0, 1.9);
  key.position.set(2.2, 0.6, 2.6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x4a6a76, 0.85);
  fill.position.set(0, 1.6, 2.4);
  scene.add(fill);
  const glint = new THREE.PointLight(0xffcc78, 2.2, 3.2);
  glint.position.set(0.3, 0.85, 1.1);
  scene.add(glint);

  const robot = buildRobot();
  scene.add(robot);

  // gold dust
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(PARTICLES * 3);
  const speed = new Float32Array(PARTICLES);
  for (let i = 0; i < PARTICLES; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 5.2;
    pos[i * 3 + 1] = -1.6 + Math.random() * 3.8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 4.4;
    speed[i] = 0.02 + Math.random() * 0.05;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffcc78,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(dust);

  // low-res render target + dither pass
  let rt = new THREE.WebGLRenderTarget(8, 8, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
  });
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    vertexShader: DITHER_VERT,
    fragmentShader: DITHER_FRAG,
    uniforms: {
      tSrc: { value: rt.texture },
      uRes: { value: new THREE.Vector2(8, 8) },
      uTime: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  let lastT = 0;

  function resize(w: number, h: number): void {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const rw = Math.max(8, Math.floor(w / CELL));
    const rh = Math.max(8, Math.floor(h / CELL));
    rt.setSize(rw, rh);
    postMat.uniforms.tSrc!.value = rt.texture;
    (postMat.uniforms.uRes!.value as THREE.Vector2).set(rw, rh);
  }

  function render(progress: number, time: number): void {
    const dt = Math.min(0.05, time - lastT);
    lastT = time;

    robot.position.y = 0.025 * Math.sin(time * 0.8);
    robot.rotation.z = 0.008 * Math.sin(time * 0.6);

    const arr = pGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLES; i++) {
      let y = arr.getY(i) + speed[i]! * dt;
      if (y > 2.3) y = -1.6;
      arr.setY(i, y);
      arr.setX(i, arr.getX(i) + Math.sin(time * 0.4 + i) * 0.0004);
    }
    arr.needsUpdate = true;

    cameraAt(progress, camera, lookTarget);
    postMat.uniforms.uTime!.value = time;

    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  function dispose(): void {
    rt.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { render, resize, dispose };
}
