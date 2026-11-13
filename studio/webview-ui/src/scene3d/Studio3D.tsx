import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createRig, disposeSharedMaterials, type Mode, poseRig, type Rig, setPlumbTone } from './characterRig.js';
import {
  advance,
  angleDelta,
  DESK_COUNT,
  deskSlot,
  DOOR_SLOT,
  firstFree,
  LOUNGE_SLOTS,
  loungeSlot,
  rerouteFrom,
  ROOM,
  type Slot,
  type Vec,
  type Waypoint,
} from './layout.js';
import { buildOffice, type GateCounts } from './officeBuilder.js';
import { COLORS } from './palette.js';

/** Someone in the office: an agent, or one of its helpers (sub-agents). */
export interface StudioActor {
  key: string;
  /** The agent whose conversation opens when this character is chosen. */
  ownerId: number;
  name: string;
  helper: boolean;
  /** Its turn is over and it waits for Ben: it goes to the lounge. */
  waiting: boolean;
  detail?: string;
}

interface Props {
  actors: readonly StudioActor[];
  onPick?: (ownerId: number) => void;
  /** Missions waiting at Ben's three gates, shown on the board; null while unknown. */
  gates?: GateCounts | null;
  /** The board was chosen: open the quests panel. */
  onOpenBoard?: () => void;
  /** Called once if this browser cannot draw WebGL, so the caller can fall back to the 2D office. */
  onUnavailable?: () => void;
}

const WALK_SPEED = 2.7;
/** How long a finished helper stays in the lounge before it leaves. */
const HELPER_LINGER_S = 45;
const LOUNGE_ORDER = LOUNGE_SLOTS.map((_, i) => i);
const DESK_ORDER = Array.from({ length: DESK_COUNT }, (_, i) => i);

interface Actor {
  key: string;
  info: StudioActor;
  rig: Rig;
  label: THREE.Sprite;
  labelKey: string;
  pos: Vec;
  yaw: number;
  path: Waypoint[];
  slot: Slot;
  desk: number | null;
  lounge: number | null;
  mode: Mode;
  seatY: number;
  appear: number;
  /** 0 when still, 1 when walking: a personal side-step on the corridor so a crowd spreads out instead of stacking. */
  blend: number;
  offset: Vec;
  leaving: boolean;
  lingerLeft: number;
  exiting: boolean;
}

function drawLabel(a: Actor): void {
  const text = `${a.info.name}|${a.info.waiting}|${a.info.detail ?? ''}`;
  if (a.labelKey === text) return;
  a.labelKey = text;
  const sprite = a.label;
  const tex = sprite.material.map as THREE.CanvasTexture;
  const canvas = tex.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.labelBack;
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, 28);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.labelText;
  ctx.font = '700 54px system-ui, sans-serif';
  const name = a.info.name.length > 20 ? `${a.info.name.slice(0, 19)}…` : a.info.name;
  ctx.fillText(name, w / 2, 56);
  ctx.fillStyle = a.info.waiting ? COLORS.labelWaiting : COLORS.labelWorking;
  ctx.font = '600 38px system-ui, sans-serif';
  const sub = a.info.waiting ? 'tour fini' : a.info.detail ? a.info.detail.slice(0, 26) : 'au travail';
  ctx.fillText(sub, w / 2, 106);
  tex.needsUpdate = true;
}

function makeLabel(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(2.0, 0.56, 1);
  sprite.position.y = 2.95;
  sprite.renderOrder = 10;
  return sprite;
}

/**
 * The 3D office. Characters walk between their desks (working) and the lounge (turn over, waiting for Ben),
 * come in by the door and leave by it. Orbit with a finger or the mouse, pinch or wheel to zoom, tap a person
 * to open its conversation.
 */
export function Studio3D({ actors, onPick, gates = null, onOpenBoard, onUnavailable }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const actorsRef = useRef<readonly StudioActor[]>(actors);
  const dirtyRef = useRef(true);
  const pickRef = useRef(onPick);
  const unavailableRef = useRef(onUnavailable);
  const gatesRef = useRef<GateCounts | null>(gates);
  const gatesDirtyRef = useRef(true);
  const boardRef = useRef(onOpenBoard);

  useEffect(() => {
    actorsRef.current = actors;
    dirtyRef.current = true;
  }, [actors]);
  useEffect(() => {
    pickRef.current = onPick;
    unavailableRef.current = onUnavailable;
    boardRef.current = onOpenBoard;
  }, [onPick, onUnavailable, onOpenBoard]);
  useEffect(() => {
    gatesRef.current = gates;
    gatesDirtyRef.current = true;
  }, [gates]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance' });
    } catch {
      unavailableRef.current?.();
      return;
    }
    const maxRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    let ratio = maxRatio;
    renderer.setPixelRatio(ratio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.outline = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.backdrop);
    const office = buildOffice();
    scene.add(office.group);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 250);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minAzimuthAngle = -0.25;
    controls.maxAzimuthAngle = Math.PI / 2 + 0.25;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.3;
    controls.minDistance = 9;
    controls.maxDistance = 140;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0.6, 1.2);

    const placeCamera = (aspect: number) => {
      // Landscape looks at the room corner-on. A phone held upright turns the view to the room's short side, so the
      // whole width fits and the person only has to zoom for detail.
      const portrait = aspect < 0.9;
      const need = portrait ? 25 : 29;
      controls.target.set(0, 0.6, portrait ? -0.4 : 1.2);
      const dist = Math.min(120, Math.max(38, need / (0.573 * Math.max(aspect, 0.3))));
      const az = portrait ? 1.3 : Math.PI / 4;
      const polar = portrait ? 0.85 : 0.95;
      camera.position.set(
        controls.target.x + dist * Math.sin(polar) * Math.sin(az),
        controls.target.y + dist * Math.cos(polar),
        controls.target.z + dist * Math.sin(polar) * Math.cos(az),
      );
    };

    const size = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return camera.aspect;
    };
    placeCamera(size());
    controls.update();
    // Until the person moves the view themselves, a resize (rotating the phone) frames the room again.
    let userMoved = false;
    controls.addEventListener('start', () => {
      userMoved = true;
    });
    const resize = new ResizeObserver(() => {
      const aspect = size();
      if (!userMoved) {
        placeCamera(aspect);
        controls.update();
      }
    });
    resize.observe(host);

    // ---- who is in the office ----
    const people = new Map<string, Actor>();
    const takenDesks = new Set<number>();
    const takenLounge = new Set<number>();

    const wantedSlot = (a: Actor, waiting: boolean): void => {
      if (a.desk !== null) takenDesks.delete(a.desk);
      if (a.lounge !== null) takenLounge.delete(a.lounge);
      a.desk = null;
      a.lounge = null;
      if (waiting) {
        const free = firstFree(LOUNGE_ORDER, takenLounge);
        a.lounge = free ?? people.size % LOUNGE_SLOTS.length;
        if (free !== null) takenLounge.add(free);
        retarget(a, loungeSlot(a.lounge));
      } else {
        const free = firstFree(DESK_ORDER, takenDesks);
        a.desk = free ?? people.size % DESK_COUNT;
        if (free !== null) takenDesks.add(free);
        retarget(a, deskSlot(a.desk));
      }
    };

    const retarget = (a: Actor, to: Slot): void => {
      a.path = rerouteFrom(a.pos, a.path, a.slot, to);
      a.slot = to;
      a.exiting = false;
    };

    const spawn = (info: StudioActor): void => {
      const rig = createRig(info.name + info.key, info.helper);
      const label = makeLabel();
      rig.root.add(label);
      const a: Actor = {
        key: info.key,
        info,
        rig,
        label,
        labelKey: '',
        pos: { ...DOOR_SLOT.pos },
        yaw: 0,
        path: [],
        slot: DOOR_SLOT,
        desk: null,
        lounge: null,
        mode: 'stand',
        seatY: 0,
        appear: 0,
        blend: 0,
        offset: { x: ((rig.seed % 7) - 3) * 0.13, z: (((rig.seed >> 3) % 7) - 3) * 0.1 },
        leaving: false,
        lingerLeft: 0,
        exiting: false,
      };
      rig.root.scale.multiplyScalar(0.01);
      scene.add(rig.root);
      people.set(info.key, a);
      wantedSlot(a, info.waiting);
      setPlumbTone(rig, info.waiting);
    };

    const sendOut = (a: Actor): void => {
      a.leaving = true;
      if (a.desk !== null) takenDesks.delete(a.desk);
      a.desk = null;
      if (a.info.helper) {
        // A helper that is done goes to the lounge, stays a while, then leaves.
        const free = firstFree(LOUNGE_ORDER, takenLounge);
        a.lounge = free ?? people.size % LOUNGE_SLOTS.length;
        if (free !== null) takenLounge.add(free);
        a.lingerLeft = HELPER_LINGER_S;
        retarget(a, loungeSlot(a.lounge));
        a.info = { ...a.info, waiting: true, detail: 'a fini' };
      } else {
        a.lingerLeft = 0;
        goToDoor(a);
      }
    };

    const goToDoor = (a: Actor): void => {
      if (a.lounge !== null) takenLounge.delete(a.lounge);
      a.lounge = null;
      retarget(a, DOOR_SLOT);
      a.exiting = true;
    };

    const reconcile = (): void => {
      const wanted = new Map(actorsRef.current.map((x) => [x.key, x]));
      for (const x of wanted.values()) {
        const a = people.get(x.key);
        if (!a) {
          spawn(x);
          continue;
        }
        if (a.leaving) {
          // It came back (same key): stop leaving.
          a.leaving = false;
          a.lingerLeft = 0;
        }
        const was = a.info.waiting;
        a.info = x;
        if (was !== x.waiting) {
          wantedSlot(a, x.waiting);
          setPlumbTone(a.rig, x.waiting);
        }
      }
      for (const a of people.values()) if (!wanted.has(a.key) && !a.leaving) sendOut(a);
    };

    const remove = (a: Actor): void => {
      if (a.desk !== null) takenDesks.delete(a.desk);
      if (a.lounge !== null) takenLounge.delete(a.lounge);
      scene.remove(a.rig.root);
      const map = a.label.material.map;
      map?.dispose();
      a.label.material.dispose();
      people.delete(a.key);
    };

    // ---- picking ----
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitAt = (clientX: number, clientY: number): Actor | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects([...people.values()].filter((p) => !p.leaving || p.info.helper).map((p) => p.rig.hit), false);
      if (hits.length === 0) return null;
      for (const p of people.values()) if (p.rig.hit === hits[0].object) return p;
      return null;
    };
    const boardAt = (clientX: number, clientY: number): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(office.boardHit, false).length > 0;
    };
    let down: { x: number; y: number; t: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 9 || performance.now() - d.t > 650) return;
      const hit = hitAt(e.clientX, e.clientY);
      if (hit) {
        pickRef.current?.(hit.info.ownerId);
        return;
      }
      if (boardRef.current && boardAt(e.clientX, e.clientY)) boardRef.current();
    };
    let lastHover = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.buttons !== 0) return;
      const now = performance.now();
      if (now - lastHover < 60) return;
      lastHover = now;
      renderer.domElement.style.cursor = hitAt(e.clientX, e.clientY) || (boardRef.current && boardAt(e.clientX, e.clientY)) ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);

    // ---- loop ----
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let slow = 0;
    let frames = 0;
    let degraded = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      clock += dt;

      // On a slow machine: first drop the resolution, then the shadows.
      frames += 1;
      slow += dt > 0.04 ? 1 : 0;
      if (frames === 90) {
        if (slow > 45 && !degraded) {
          degraded = true;
          ratio = 1;
          renderer.setPixelRatio(ratio);
          renderer.shadowMap.enabled = false;
          scene.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.Material | undefined;
            if (m) m.needsUpdate = true;
          });
          size();
        }
        frames = 0;
        slow = 0;
      }

      if (gatesDirtyRef.current) {
        gatesDirtyRef.current = false;
        office.setGateCounts(gatesRef.current);
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        reconcile();
      }

      const busy = new Set<number>();
      for (const a of [...people.values()]) {
        const walk = advance(a.pos, a.path, WALK_SPEED * dt);
        a.pos = walk.pos;
        a.path = walk.path;
        const moving = !walk.arrived;
        if (moving) {
          a.mode = 'walk';
          a.seatY = 0;
          if (walk.heading !== null) a.yaw += angleDelta(a.yaw, walk.heading) * (1 - Math.exp(-12 * dt));
        } else {
          a.mode = a.slot.pose === 'sit' || a.slot.pose === 'type' ? a.slot.pose : 'stand';
          a.seatY = a.slot.seatY;
          a.yaw += angleDelta(a.yaw, a.slot.yaw) * (1 - Math.exp(-9 * dt));
          if (a.exiting) {
            remove(a);
            continue;
          }
          if (a.leaving && a.info.helper && a.lingerLeft > 0) {
            a.lingerLeft -= dt;
            if (a.lingerLeft <= 0) goToDoor(a);
          }
        }

        if (a.desk !== null && !moving && a.mode === 'type') busy.add(a.desk);

        a.appear = Math.min(1, a.appear + dt * 2.2);
        const base = a.info.helper ? 0.88 : 1;
        const s = base * (0.01 + 0.99 * (1 - Math.pow(1 - a.appear, 3)));
        a.rig.root.scale.setScalar(s);
        a.blend += ((moving ? 1 : 0) - a.blend) * (1 - Math.exp(-6 * dt));
        a.rig.root.position.set(a.pos.x + a.offset.x * a.blend, 0, a.pos.z + a.offset.z * a.blend);
        a.rig.root.rotation.y = a.yaw;
        poseRig(a.rig, a.mode, clock, dt, a.seatY);
        a.rig.plumb.rotation.y = clock * 1.6;
        a.rig.plumb.position.y = 2.55 + Math.sin(clock * 2.2 + a.rig.seed) * 0.06;
        drawLabel(a);
      }
      for (let i = 0; i < DESK_COUNT; i++) office.setDeskActive(i, busy.has(i));

      // Keep the view on the room.
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, ROOM.minX, ROOM.maxX);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, ROOM.minZ, ROOM.maxZ);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 2);
      controls.update();
      office.update(clock);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onMove);
      controls.dispose();
      for (const a of [...people.values()]) remove(a);
      office.dispose();
      disposeSharedMaterials();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" data-testid="studio-3d" />;
}
