// The customer ascent (for-customers page) — two acts:
//
//   ACT I — THE MESS (p 0.00–0.30)
//     A storm of tumbling spreadsheet shards swirls around a dim, powered-
//     down robot. At p≈0.18 the turn begins: shards fly into a clean
//     orbiting halo and the robot powers on — chaos becomes a governed
//     working model.
//
//   ACT II — THE CLIMB (p 0.30–1.00)
//     Five gold-edged platforms staircase upward — the engagement ladder.
//     The robot ascends rung by rung (hover-hops), the camera craning
//     alongside; the finale pulls wide on the full staircase.
//
// Same Bayer-dither pipeline as the other cinematic stages.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
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

const ORDER_FROM = 0.18;
const ORDER_TO = 0.3;
const CLIMB_FROM = 0.38;
const CLIMB_TO = 0.855;
const FINALE_FROM = 0.88;

/** Rung i: platform position + the robot's standing height on it. */
const rung = (i: number) => ({
  x: i * 1.35,
  y: -1.35 + i * 0.5,           // slab centre
  robotY: i * 0.5 - 0.26,       // feet resting on the slab top
});

export function createAscent(canvas: HTMLCanvasElement): OrbitScene {
  const small = (window.innerWidth || 1200) < 700;
  const CELL = small ? 4 : 3;
  const SHARDS = small ? 50 : 90;

  const { renderer, applyEnvironment, dispose: disposeRenderer } = createRenderer(canvas);
  const scene = new THREE.Scene();
  applyEnvironment(scene);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 40);
  addStudioLights(scene);
  const updateDust = addGoldDust(scene, small ? 100 : 280);

  const rig = buildRobot();
  rig.group.position.y = rung(0).robotY;
  rig.emissives.core.emissiveIntensity = 0;
  rig.emissives.bezel.emissiveIntensity = 0;
  scene.add(rig.group);

  // — the shard storm / halo —
  const shardGeo = new RoundedBoxGeometry(0.22, 0.14, 0.02, 2, 0.01);
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0x232b30,
    metalness: 0.85,
    roughness: 0.5,
    envMapIntensity: 0.9,
  });
  const halo = new THREE.Group();
  scene.add(halo);
  interface Shard {
    mesh: THREE.Mesh;
    chaos: THREE.Vector3;
    spin: THREE.Vector3;
    home: THREE.Vector3;
    homeRotY: number;
    delay: number;
  }
  const shards: Shard[] = [];
  for (let i = 0; i < SHARDS; i++) {
    const mesh = new THREE.Mesh(shardGeo, shardMat);
    // chaos: scattered shell around the robot
    const a = hash(i) * Math.PI * 2;
    const b = hash(i + 40) * Math.PI - Math.PI / 2;
    const r = 1.6 + hash(i + 80) * 2.2;
    const chaos = new THREE.Vector3(
      Math.cos(b) * Math.cos(a) * r,
      Math.sin(b) * r * 0.7 + 0.15,
      Math.cos(b) * Math.sin(a) * r,
    );
    // order: two clean rings around the robot's torso
    const ringIdx = i % 2;
    const slot = Math.floor(i / 2);
    const perRing = Math.ceil(SHARDS / 2);
    const ang = (slot / perRing) * Math.PI * 2;
    const rr = ringIdx === 0 ? 1.05 : 1.3;
    const home = new THREE.Vector3(
      Math.cos(ang) * rr,
      ringIdx === 0 ? 0.15 : 0.55,
      Math.sin(ang) * rr,
    );
    halo.add(mesh);
    shards.push({
      mesh,
      chaos,
      spin: new THREE.Vector3(hash(i + 120) * 4, hash(i + 160) * 4, hash(i + 200) * 4),
      home,
      homeRotY: -ang,
      delay: hash(i + 240) * 0.5,
    });
  }

  // — the ladder platforms —
  const slabMat = new THREE.MeshPhysicalMaterial({
    color: 0x181d21,
    metalness: 0.85,
    roughness: 0.45,
    envMapIntensity: 0.9,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xffcc78,
    metalness: 1,
    roughness: 0.3,
    emissive: 0x543a12,
    emissiveIntensity: 0.4,
  });
  const platforms: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const { x, y } = rung(i);
    const slab = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.1, 1.1, 2, 0.03), slabMat);
    g.add(slab);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.016, 0.05), edgeMat);
    edge.position.set(0, 0.055, 0.53);
    g.add(edge);
    g.position.set(x, y, 0);
    g.scale.setScalar(0.001);
    scene.add(g);
    platforms.push(g);
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

    // — shards: chaos ↔ halo —
    const orderK = smooth(clamp01((p - ORDER_FROM) / (ORDER_TO - ORDER_FROM)));
    halo.rotation.y = time * (0.28 + 0.35 * (1 - orderK));
    for (const s of shards) {
      const k = smooth(clamp01((orderK * 1.5 - s.delay) / 1.0));
      s.mesh.position.lerpVectors(s.chaos, s.home, k);
      if (k < 1) {
        s.mesh.rotation.set(
          s.spin.x + time * 0.9 * (1 - k),
          s.spin.y + time * 0.7 * (1 - k),
          s.spin.z * (1 - k),
        );
      } else {
        s.mesh.rotation.set(0, s.homeRotY, 0);
      }
    }

    // — power-on with the turn —
    rig.emissives.core.emissiveIntensity = 0.5 * orderK;
    rig.emissives.bezel.emissiveIntensity = 0.9 * orderK;

    // — platform reveal, staggered just ahead of the climb —
    for (let i = 0; i < 5; i++) {
      const k = smooth(clamp01((p - (0.3 + i * 0.02)) / 0.06));
      platforms[i]!.scale.setScalar(Math.max(0.001, k));
    }

    // — the climb: continuous rung position with hover-hops —
    const climbPos = clamp01((p - CLIMB_FROM) / (CLIMB_TO - CLIMB_FROM)) * 4;
    const seg = Math.min(3, Math.floor(climbPos));
    const frac = climbPos - seg;
    const hopK = smooth(clamp01(frac));
    const a = rung(seg);
    const b = rung(seg + 1);
    const rx = climbPos >= 4 ? rung(4).x : lerp(a.x, b.x, hopK);
    const ry = (climbPos >= 4 ? rung(4).robotY : lerp(a.robotY, b.robotY, hopK))
      + Math.sin(Math.min(1, hopK) * Math.PI) * (climbPos > 0 && climbPos < 4 ? 0.32 : 0)
      + 0.02 * Math.sin(time * 0.8);
    rig.group.position.set(rx, ry, 0);

    // halo follows the robot up the ladder
    halo.position.set(rx, ry + 0.1, 0);

    // — camera: drift the storm → settle → crane alongside → wide finale —
    if (p < ORDER_TO) {
      const az = -0.9 + p * 3.2;
      const r = 4.3 - orderK * 0.5;
      camera.position.set(Math.sin(az) * r, 0.4, Math.cos(az) * r);
      camera.lookAt(0, -0.05, 0);
    } else if (p < FINALE_FROM) {
      camera.position.set(rx - 1.7, ry + 0.85, 4.3);
      camera.lookAt(rx + 0.4, ry + 0.15, 0);
    } else {
      const t = smooth(clamp01((p - FINALE_FROM) / (1 - FINALE_FROM)));
      const top = rung(4);
      camera.position.set(
        lerp(top.x - 1.7, top.x - 3.4, t),
        lerp(top.robotY + 0.85, top.robotY + 1.7, t),
        lerp(4.3, 7.2, t),
      );
      camera.lookAt(lerp(top.x + 0.4, top.x - 1.6, t), lerp(top.robotY + 0.15, top.robotY - 1.0, t), 0);
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
