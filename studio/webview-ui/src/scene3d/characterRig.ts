import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { COLORS, hashOf, pick } from './palette.js';

export type Mode = 'walk' | 'type' | 'sit' | 'stand';

interface Joints {
  legUpL: number;
  legUpR: number;
  legLowL: number;
  legLowR: number;
  armUpL: number;
  armUpR: number;
  armLowL: number;
  armLowR: number;
  armSpread: number;
  lean: number;
  headTurn: number;
  bodyY: number;
}

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  /** Everything above the hips: it leans on its own while the legs stay put. */
  upper: THREE.Group;
  head: THREE.Group;
  torso: THREE.Mesh;
  legUpL: THREE.Group;
  legUpR: THREE.Group;
  legLowL: THREE.Group;
  legLowR: THREE.Group;
  armUpL: THREE.Group;
  armUpR: THREE.Group;
  armLowL: THREE.Group;
  armLowR: THREE.Group;
  plumb: THREE.Mesh;
  hit: THREE.Mesh;
  joints: Joints;
  seed: number;
}

const materials = new Map<number, THREE.MeshStandardMaterial>();

/** One shared material per colour: dozens of characters, a handful of materials. */
export function material(color: number, roughness = 0.65): THREE.MeshStandardMaterial {
  const key = color * 10 + Math.round(roughness * 9);
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
    materials.set(key, m);
  }
  return m;
}

export function disposeSharedMaterials(): void {
  for (const m of materials.values()) m.dispose();
  materials.clear();
}

const geo = {
  torso: new RoundedBoxGeometry(0.62, 0.7, 0.34, 3, 0.1),
  pelvis: new RoundedBoxGeometry(0.58, 0.26, 0.32, 3, 0.08),
  head: new THREE.SphereGeometry(0.26, 28, 20),
  hair: new THREE.SphereGeometry(0.275, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42),
  eye: new THREE.SphereGeometry(0.034, 10, 8),
  thigh: new THREE.CapsuleGeometry(0.115, 0.34, 4, 10),
  shin: new THREE.CapsuleGeometry(0.1, 0.34, 4, 10),
  shoe: new RoundedBoxGeometry(0.22, 0.11, 0.34, 2, 0.04),
  arm: new THREE.CapsuleGeometry(0.085, 0.28, 4, 10),
  fore: new THREE.CapsuleGeometry(0.075, 0.26, 4, 10),
  hand: new THREE.SphereGeometry(0.085, 12, 10),
  plumb: new THREE.OctahedronGeometry(0.17, 0),
  hit: new THREE.CapsuleGeometry(0.5, 1.3, 2, 8),
};

function part(geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/**
 * A stylised person built from rounded primitives, with real joints (hips, knees, shoulders, elbows) so it
 * can walk, sit and type. Front is +z. Standing height is about 1.8 m before the helper's 0.9 scale.
 */
export function createRig(seedText: string, helper: boolean): Rig {
  const seed = hashOf(seedText);
  const skin = material(pick(COLORS.skin, seed), 0.55);
  const hair = material(pick(COLORS.hair, seed, 1), 0.8);
  const shirt = material(helper ? COLORS.helperAccent : pick(COLORS.shirt, seed, 2), 0.7);
  const pants = material(pick(COLORS.pants, seed, 3), 0.8);
  const shoe = material(COLORS.shoe, 0.6);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const pelvis = part(geo.pelvis, pants, 0, 0.86, 0);
  body.add(pelvis);
  const upper = new THREE.Group();
  upper.position.set(0, 0.86, 0);
  body.add(upper);
  const torso = part(geo.torso, shirt, 0, 0.42, 0);
  upper.add(torso);

  const head = new THREE.Group();
  head.position.set(0, 0.98, 0);
  head.add(part(geo.head, skin));
  const cap = part(geo.hair, hair, 0, 0.02, -0.03);
  head.add(cap);
  for (const sx of [-1, 1]) head.add(part(geo.eye, material(COLORS.eye, 0.3), sx * 0.09, 0.02, 0.235));
  upper.add(head);

  const leg = (sx: number) => {
    const up = new THREE.Group();
    up.position.set(sx * 0.16, 0.86, 0);
    up.add(part(geo.thigh, pants, 0, -0.26, 0));
    const low = new THREE.Group();
    low.position.set(0, -0.5, 0);
    low.add(part(geo.shin, pants, 0, -0.26, 0));
    low.add(part(geo.shoe, shoe, 0, -0.5, 0.06));
    up.add(low);
    body.add(up);
    return { up, low };
  };
  const arm = (sx: number) => {
    const up = new THREE.Group();
    up.position.set(sx * 0.4, 0.7, 0);
    up.add(part(geo.arm, shirt, 0, -0.2, 0));
    const low = new THREE.Group();
    low.position.set(0, -0.38, 0);
    low.add(part(geo.fore, skin, 0, -0.18, 0));
    low.add(part(geo.hand, skin, 0, -0.38, 0));
    up.add(low);
    upper.add(up);
    return { up, low };
  };
  const l = leg(-1);
  const r = leg(1);
  const al = arm(-1);
  const ar = arm(1);

  const plumb = new THREE.Mesh(geo.plumb, new THREE.MeshStandardMaterial({ color: COLORS.plumbWorking, emissive: COLORS.plumbWorking, emissiveIntensity: 0.9, roughness: 0.25, flatShading: true }));
  plumb.scale.set(1, 1.7, 1);
  plumb.position.set(0, 2.55, 0);
  root.add(plumb);

  // A generous invisible capsule: the thing a finger or a mouse actually hits.
  const hit = new THREE.Mesh(geo.hit, new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 1.0, 0);
  root.add(hit);

  if (helper) root.scale.setScalar(0.88);

  return {
    root,
    body,
    upper,
    head,
    torso,
    legUpL: l.up,
    legUpR: r.up,
    legLowL: l.low,
    legLowR: r.low,
    armUpL: al.up,
    armUpR: ar.up,
    armLowL: al.low,
    armLowR: ar.low,
    plumb,
    hit,
    joints: { legUpL: 0, legUpR: 0, legLowL: 0, legLowR: 0, armUpL: 0, armUpR: 0, armLowL: 0, armLowR: 0, armSpread: 0.08, lean: 0, headTurn: 0, bodyY: 0 },
    seed,
  };
}

export function setPlumbTone(rig: Rig, waiting: boolean): void {
  const m = rig.plumb.material as THREE.MeshStandardMaterial;
  const c = waiting ? COLORS.plumbWaiting : COLORS.plumbWorking;
  m.color.setHex(c);
  m.emissive.setHex(c);
}

function targets(mode: Mode, t: number, seed: number, seatY: number): Joints {
  const ph = (seed % 628) / 100;
  switch (mode) {
    case 'walk': {
      const s = Math.sin(t * 9 + ph);
      return {
        legUpL: s * 0.75,
        legUpR: -s * 0.75,
        legLowL: Math.max(0, -s) * 0.9,
        legLowR: Math.max(0, s) * 0.9,
        armUpL: -s * 0.6,
        armUpR: s * 0.6,
        armLowL: -0.35,
        armLowR: -0.35,
        armSpread: 0.1,
        lean: 0.06,
        headTurn: 0,
        bodyY: Math.abs(Math.sin(t * 9 + ph)) * 0.04,
      };
    }
    case 'type': {
      const k = Math.sin(t * 13 + ph);
      const k2 = Math.sin(t * 11 + ph + 1.7);
      return {
        legUpL: -Math.PI / 2,
        legUpR: -Math.PI / 2,
        legLowL: Math.PI / 2,
        legLowR: Math.PI / 2,
        armUpL: -0.95,
        armUpR: -0.95,
        armLowL: -0.85 + k * 0.1,
        armLowR: -0.85 + k2 * 0.1,
        armSpread: 0.02,
        lean: 0.12,
        headTurn: Math.sin(t * 0.7 + ph) * 0.06,
        bodyY: -seatY,
      };
    }
    case 'sit': {
      return {
        legUpL: -Math.PI / 2,
        legUpR: -Math.PI / 2,
        legLowL: Math.PI / 2 - 0.1,
        legLowR: Math.PI / 2 - 0.1,
        armUpL: -0.35,
        armUpR: -0.35,
        armLowL: -0.95,
        armLowR: -0.95,
        armSpread: 0.12,
        lean: -0.05 + Math.sin(t * 1.4 + ph) * 0.015,
        headTurn: Math.sin(t * 0.5 + ph) * 0.25,
        bodyY: -seatY,
      };
    }
    default: {
      const b = Math.sin(t * 1.6 + ph);
      return {
        legUpL: 0,
        legUpR: 0,
        legLowL: 0,
        legLowR: 0,
        armUpL: 0.06 + b * 0.02,
        armUpR: 0.06 + b * 0.02,
        armLowL: -0.12,
        armLowR: -0.12,
        armSpread: 0.1,
        lean: b * 0.01,
        headTurn: Math.sin(t * 0.45 + ph) * 0.3,
        bodyY: 0,
      };
    }
  }
}

const KEYS = ['legUpL', 'legUpR', 'legLowL', 'legLowR', 'armUpL', 'armUpR', 'armLowL', 'armLowR', 'armSpread', 'lean', 'headTurn', 'bodyY'] as const;

/** Eases every joint toward the pose for `mode` (about a tenth of a second to settle) and applies it. */
export function poseRig(rig: Rig, mode: Mode, t: number, dt: number, seatY: number): void {
  const goal = targets(mode, t, rig.seed, seatY);
  const k = 1 - Math.exp(-14 * dt);
  const j = rig.joints;
  for (const key of KEYS) j[key] += (goal[key] - j[key]) * k;

  rig.legUpL.rotation.x = j.legUpL;
  rig.legUpR.rotation.x = j.legUpR;
  rig.legLowL.rotation.x = j.legLowL;
  rig.legLowR.rotation.x = j.legLowR;
  rig.armUpL.rotation.x = j.armUpL;
  rig.armUpR.rotation.x = j.armUpR;
  rig.armUpL.rotation.z = j.armSpread;
  rig.armUpR.rotation.z = -j.armSpread;
  rig.armLowL.rotation.x = j.armLowL;
  rig.armLowR.rotation.x = j.armLowR;
  rig.upper.rotation.x = j.lean;
  rig.body.position.y = j.bodyY;
  rig.head.rotation.y = j.headTurn;
}
