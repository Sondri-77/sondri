// The industries rank (industries page): six deployed Sondri units standing
// in line, one per sector. The camera dollies laterally along the rank like
// an inspection line — each unit powers on (core + engraved indices ignite)
// as the camera reaches it. Opens and closes on the whole formation.
//
//   p 0.00–0.06  wide establishing shot of the rank
//   p 0.06–0.88  lateral tracking shot, unit by unit
//   p 0.88–1.00  pull back + rise to the full formation
//
// Same Bayer-dither pipeline as the other cinematic stages.

import * as THREE from 'three';
import {
  buildRobot, createRenderer, createDitherPost, addStudioLights, addGoldDust,
} from './scene';
import type { OrbitScene, RobotRig } from './scene';

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Unit x-positions, aligned so each beat window centers on its unit. */
export const UNIT_XS = [-2.77, -1.62, -0.48, 0.66, 1.8, 2.95];

const TRACK_FROM = 0.06;
const TRACK_TO = 0.88;
const CAM_X_MIN = -3.6;
const CAM_X_MAX = 3.6;

export function createRank(canvas: HTMLCanvasElement): OrbitScene {
  const small = (window.innerWidth || 1200) < 700;
  const CELL = small ? 4 : 3;

  const { renderer, applyEnvironment, dispose: disposeRenderer } = createRenderer(canvas);
  const scene = new THREE.Scene();
  applyEnvironment(scene);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 40);
  addStudioLights(scene);
  const updateDust = addGoldDust(scene, small ? 120 : 320);

  // six independent rigs: each has its own materials, so each unit can
  // power on individually as the camera reaches it
  const units: RobotRig[] = UNIT_XS.map((x) => {
    const rig = buildRobot();
    rig.group.position.x = x;
    rig.emissives.core.emissiveIntensity = 0.05;
    rig.emissives.bezel.emissiveIntensity = 0.08;
    scene.add(rig.group);
    return rig;
  });

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

    // camera path: establish → track → pull back
    const trackT = clamp01((p - TRACK_FROM) / (TRACK_TO - TRACK_FROM));
    const camX = lerp(CAM_X_MIN, CAM_X_MAX, trackT);
    if (p < TRACK_FROM) {
      const t = smooth(p / TRACK_FROM);
      camera.position.set(lerp(-4.6, CAM_X_MIN, t), lerp(0.95, 0.25, t), lerp(6.2, 2.3, t));
      const lx = lerp(0, CAM_X_MIN + 0.5, t);
      camera.lookAt(lx, lerp(0.1, 0.12, t), 0);
    } else if (p <= TRACK_TO) {
      camera.position.set(camX, 0.25, 2.3);
      camera.lookAt(camX + 0.5, 0.12, 0);
    } else {
      const t = smooth((p - TRACK_TO) / (1 - TRACK_TO));
      camera.position.set(lerp(CAM_X_MAX, 0.9, t), lerp(0.25, 1.6, t), lerp(2.3, 6.6, t));
      camera.lookAt(lerp(CAM_X_MAX + 0.5, 0, t), lerp(0.12, 0.05, t), lerp(0, -0.3, t));
    }

    // per-unit idle bob + proximity power-on
    for (let i = 0; i < units.length; i++) {
      const u = units[i]!;
      u.group.position.y = 0.02 * Math.sin(time * 0.8 + i * 1.3);
      const d = Math.abs(camX - UNIT_XS[i]!);
      const near = p < TRACK_FROM || p > TRACK_TO ? 0.35 : clamp01(1 - d / 0.9);
      const glow = smooth(near);
      u.emissives.core.emissiveIntensity = 0.05 + 0.45 * glow;
      u.emissives.bezel.emissiveIntensity = 0.08 + 0.95 * glow;
    }

    updateDust(time, dt);
    post.render(scene, camera, time);
  }

  function dispose(): void {
    post.dispose();
    disposeRenderer();
  }

  return { render, resize, dispose };
}
