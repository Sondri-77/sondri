// The delivery-engine assembly sequence (how-it-works page).
// Scroll tells the 0 → 1 → n story literally:
//   p 0.00–0.28  DISCOVER — parts drift scattered in the void, slowly tumbling
//   p 0.28–0.58  BUILD    — parts fly home and snap together, staggered
//   p 0.58–0.66  DEPLOY   — power-on: eyes pop, core + engraved indices light up
//   p 0.66–1.00  SCALE    — camera pulls back; a fleet of clones rises in
// Rendered through the same Bayer-dither pipeline as the homepage hero.

import * as THREE from 'three';
import {
  buildRobot, createRenderer, createDitherPost, addStudioLights, addGoldDust,
} from './scene';
import type { OrbitScene } from './scene';

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

interface Scatter {
  pos: THREE.Vector3;
  rot: THREE.Euler;
}

export function createAssembly(canvas: HTMLCanvasElement): OrbitScene {
  const small = (window.innerWidth || 1200) < 700;
  const CELL = small ? 4 : 3;

  const { renderer, applyEnvironment, dispose: disposeRenderer } = createRenderer(canvas);
  const scene = new THREE.Scene();
  applyEnvironment(scene);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  addStudioLights(scene);
  const updateDust = addGoldDust(scene, small ? 120 : 360);

  const rig = buildRobot();
  scene.add(rig.group);

  // deterministic scatter transform per part (stable across reloads)
  const scatters: Scatter[] = rig.parts.map((_, i) => {
    const a = hash(i) * Math.PI * 2;
    const b = hash(i + 50) * Math.PI - Math.PI / 2;
    const r = 1.7 + hash(i + 100) * 1.6;
    return {
      pos: new THREE.Vector3(
        Math.cos(b) * Math.cos(a) * r,
        Math.sin(b) * r * 0.75 + 0.1,
        Math.cos(b) * Math.sin(a) * r,
      ),
      rot: new THREE.Euler(hash(i + 150) * 5, hash(i + 200) * 5, hash(i + 250) * 5),
    };
  });

  // emissives start cold; eyes start hidden — they power on at DEPLOY
  rig.emissives.core.emissiveIntensity = 0;
  rig.emissives.bezel.emissiveIntensity = 0;
  for (const eye of rig.eyes) eye.scale.setScalar(0.001);

  // the fleet (1 → n): clones share geometry + materials, so they're cheap
  const FLEET: THREE.Group[] = [];
  const fleetSlots: THREE.Vector3[] = [];
  for (const gx of [-2.4, -1.2, 1.2, 2.4]) fleetSlots.push(new THREE.Vector3(gx, 0, -1.5));
  for (const gx of [-3.0, -1.8, 1.8, 3.0]) fleetSlots.push(new THREE.Vector3(gx, 0, -3.2));
  for (const slot of fleetSlots) {
    const clone = rig.group.clone();
    clone.position.copy(slot);
    clone.scale.setScalar(0.001);
    scene.add(clone);
    FLEET.push(clone);
  }

  const post = createDitherPost(renderer, CELL);
  let lastT = 0;

  function resize(w: number, h: number): void {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post.setSize(w, h);
  }

  function render(p: number, time: number): void {
    const dt = Math.min(0.05, time - lastT);
    lastT = time;

    // per-part assembly: staggered fly-in during the BUILD window
    const N = rig.parts.length;
    for (let i = 0; i < N; i++) {
      const part = rig.parts[i]!;
      const sc = scatters[i]!;
      const home = part.userData.home as { pos: THREE.Vector3; rot: THREE.Euler };
      // each part gets a 0.14-wide window inside [0.28, 0.58], staggered
      const start = 0.28 + (i / N) * 0.16;
      const k = smooth(clamp01((p - start) / 0.14));
      if (k <= 0) {
        // scattered: slow tumble + drift
        part.position.set(
          sc.pos.x + 0.05 * Math.sin(time * 0.5 + i),
          sc.pos.y + 0.06 * Math.sin(time * 0.4 + i * 2.1),
          sc.pos.z + 0.05 * Math.cos(time * 0.45 + i),
        );
        part.rotation.set(
          sc.rot.x + time * 0.12,
          sc.rot.y + time * 0.1,
          sc.rot.z,
        );
      } else if (k >= 1) {
        part.position.copy(home.pos);
        part.rotation.copy(home.rot);
      } else {
        part.position.lerpVectors(sc.pos, home.pos, k);
        part.rotation.set(
          lerp(sc.rot.x + time * 0.12 * (1 - k), home.rot.x, k),
          lerp(sc.rot.y + time * 0.1 * (1 - k), home.rot.y, k),
          lerp(sc.rot.z, home.rot.z, k),
        );
      }
    }

    // DEPLOY: power-on ramp — eyes pop, core + engraved indices ignite
    const power = smooth(clamp01((p - 0.58) / 0.08));
    rig.emissives.core.emissiveIntensity = 0.35 * power;
    rig.emissives.bezel.emissiveIntensity = 0.9 * power;
    const eyeS = power * (1 + 0.15 * Math.sin(time * 6) * (1 - power));
    for (const eye of rig.eyes) eye.scale.setScalar(Math.max(0.001, eyeS));

    // SCALE: the fleet rises, staggered
    for (let i = 0; i < FLEET.length; i++) {
      const start = 0.72 + (i / FLEET.length) * 0.2;
      const k = smooth(clamp01((p - start) / 0.1));
      FLEET[i]!.scale.setScalar(Math.max(0.001, k));
      FLEET[i]!.position.y = fleetSlots[i]!.y - (1 - k) * 0.35;
    }

    // gentle float once assembled
    const assembled = smooth(clamp01((p - 0.5) / 0.12));
    rig.group.position.y = assembled * 0.02 * Math.sin(time * 0.8);

    updateDust(time, dt);

    // camera: slow arc through DISCOVER/BUILD, settle front for DEPLOY,
    // pull back and rise for SCALE so the whole fleet frames up
    const pull = smooth(clamp01((p - 0.66) / 0.3));
    const az = lerp(-0.55, 0.25, smooth(clamp01(p / 0.66))) - pull * 0.25;
    const r = 3.5 + pull * 2.6;
    const y = 0.3 + pull * 0.55;
    camera.position.set(Math.sin(az) * r, y, Math.cos(az) * r);
    camera.lookAt(0, 0.05 - pull * 0.05, -pull * 1.2);

    post.render(scene, camera, time);
  }

  function dispose(): void {
    post.dispose();
    disposeRenderer();
  }

  return { render, resize, dispose };
}
