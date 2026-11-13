import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { material } from './characterRig.js';
import { CORRIDOR_X, DESK_COUNT, deskCenter, ROOM } from './layout.js';
import { COLORS } from './palette.js';

/** Missions waiting for Ben at each gate: calendar (1), quality check (2), sending (3). */
export interface GateCounts {
  calendar: number;
  qa: number;
  send: number;
}

export interface Office {
  group: THREE.Group;
  /** Lights a desk's screen while someone works at it. */
  setDeskActive: (index: number, active: boolean) => void;
  update: (t: number) => void;
  /** Shows how many missions wait at each of Ben's three gates (null = no data yet). */
  setGateCounts: (counts: GateCounts | null) => void;
  /** The mission board on the left wall: choosing it opens the quests panel. */
  boardHit: THREE.Mesh;
  dispose: () => void;
  lights: { sun: THREE.DirectionalLight };
}

function rbox(w: number, h: number, d: number, color: number, x: number, y: number, z: number, r = 0.05, rough = 0.7): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), material(color, rough));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, seg = 24): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material(color, 0.7));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

function plankTexture(base: number, dark: number): THREE.CanvasTexture {
  return canvasTexture(
    512,
    512,
    (ctx) => {
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? hex(dark) : hex(base);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, i * 64, 512, 62);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, i * 64 + 62, 512, 2);
        const offset = (i * 137) % 256;
        ctx.fillRect(offset, i * 64, 2, 62);
        ctx.fillRect((offset + 256) % 512, i * 64, 2, 62);
      }
    },
    [3, 5],
  );
}

function tileTexture(base: number, dark: number): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = hex(dark);
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillRect(128, 128, 128, 128);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 126, 256, 4);
      ctx.fillRect(126, 0, 4, 256);
    },
    [3, 5],
  );
}

function signTexture(text: string): THREE.CanvasTexture {
  return canvasTexture(1024, 256, (ctx) => {
    ctx.fillStyle = COLORS.signBack;
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 240, 40);
    ctx.fill();
    ctx.fillStyle = COLORS.signText;
    ctx.font = '800 130px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 138);
  });
}

function drawBoard(ctx: CanvasRenderingContext2D, w: number, h: number, counts: GateCounts | null): void {
  ctx.fillStyle = COLORS.boardPaperHex;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillText('MISSIONS : LES 3 PORTES DE BEN', w / 2, 56);
  const cols = [
    { name: 'PORTE 1', sub: 'Calendrier', n: counts?.calendar ?? 0, color: COLORS.boardCols[0] },
    { name: 'PORTE 2', sub: 'Contrôle qualité', n: counts?.qa ?? 0, color: COLORS.boardCols[1] },
    { name: 'PORTE 3', sub: 'Envoi', n: counts?.send ?? 0, color: COLORS.boardCols[2] },
  ];
  const colW = (w - 80) / 3;
  cols.forEach((c, i) => {
    const x = 40 + i * colW + colW / 2;
    const waiting = c.n > 0;
    ctx.fillStyle = waiting ? c.color : COLORS.boardIdle;
    ctx.beginPath();
    ctx.roundRect(x - colW / 2 + 12, 110, colW - 24, h - 160, 28);
    ctx.fill();
    ctx.fillStyle = waiting ? COLORS.boardTextOn : COLORS.boardTextOff;
    ctx.font = '700 40px system-ui, sans-serif';
    ctx.fillText(c.name, x, 160);
    ctx.font = '600 32px system-ui, sans-serif';
    ctx.fillText(c.sub, x, 205);
    ctx.font = '800 150px system-ui, sans-serif';
    ctx.fillText(counts ? String(c.n) : '-', x, 320);
    ctx.font = '600 30px system-ui, sans-serif';
    ctx.fillText(waiting ? (c.n > 1 ? 'à valider' : 'à valider') : 'rien en attente', x, 410);
  });
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(counts ? 'Touche le tableau pour ouvrir les missions' : 'Missions : connexion avec le jeton nécessaire', w / 2, h - 28);
}

function plant(x: number, z: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.24, 0.45, COLORS.plantPot, 0, 0.225, 0));
  const leaves = [
    [0, 0.85, 0, 0.36, COLORS.plantLeaf],
    [0.18, 0.7, 0.1, 0.26, COLORS.plantLeaf2],
    [-0.16, 0.75, -0.08, 0.28, COLORS.plantLeaf2],
    [0.02, 1.08, 0.02, 0.24, COLORS.plantLeaf],
  ] as const;
  for (const [lx, ly, lz, r, c] of leaves) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), material(c, 0.8));
    m.position.set(lx, ly, lz);
    m.castShadow = true;
    g.add(m);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  return g;
}

function sofa(x: number, z: number, length: number, color: number, dark: number): THREE.Group {
  const g = new THREE.Group();
  g.add(rbox(length, 0.5, 1.15, color, 0, 0.3, 0, 0.12));
  g.add(rbox(length, 0.85, 0.32, dark, 0, 0.72, -0.5, 0.12));
  g.add(rbox(0.3, 0.65, 1.15, dark, -length / 2 + 0.15, 0.55, 0, 0.1));
  g.add(rbox(0.3, 0.65, 1.15, dark, length / 2 - 0.15, 0.55, 0, 0.1));
  g.add(rbox(length - 0.7, 0.18, 0.9, color, 0, 0.62, 0.05, 0.08));
  g.position.set(x, 0, z);
  return g;
}

function armchair(x: number, z: number, yaw: number): THREE.Group {
  const g = new THREE.Group();
  g.add(rbox(1.1, 0.45, 1.05, COLORS.armchair, 0, 0.28, 0, 0.12));
  g.add(rbox(1.1, 0.8, 0.28, COLORS.armchair, 0, 0.62, -0.46, 0.12));
  g.add(rbox(0.22, 0.55, 1.05, COLORS.armchair, -0.5, 0.5, 0, 0.08));
  g.add(rbox(0.22, 0.55, 1.05, COLORS.armchair, 0.5, 0.5, 0, 0.08));
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  return g;
}

function deskUnit(index: number, screens: THREE.MeshStandardMaterial[]): THREE.Group {
  const c = deskCenter(index);
  const g = new THREE.Group();
  g.position.set(c.x, 0, c.z);

  g.add(rbox(2.0, 0.08, 0.95, COLORS.desk, 0, 0.78, 0, 0.04, 0.45));
  for (const sx of [-0.9, 0.9]) for (const sz of [-0.38, 0.38]) g.add(rbox(0.07, 0.76, 0.07, COLORS.deskLeg, sx, 0.38, sz, 0.02));

  // Monitor: its screen is a separate material so it can glow while someone works there.
  g.add(rbox(0.9, 0.55, 0.05, COLORS.monitorBody, 0, 1.3, -0.25, 0.03));
  const screenMat = new THREE.MeshStandardMaterial({ color: COLORS.screenOff, emissive: COLORS.screenOn, emissiveIntensity: 0, roughness: 0.3 });
  screens[index] = screenMat;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), screenMat);
  // A plane's front is +z, which is the side the person sits on.
  screen.position.set(0, 1.3, -0.2);
  g.add(screen);
  g.add(rbox(0.12, 0.26, 0.1, COLORS.monitorBody, 0, 0.96, -0.25, 0.02));
  g.add(rbox(0.4, 0.03, 0.18, COLORS.keyboard, 0, 0.835, 0.15, 0.015));
  g.add(cyl(0.05, 0.05, 0.1, COLORS.mug, 0.7, 0.87, 0.1, 14));

  // Chair, pulled up behind the person.
  const color = COLORS.chair[(index + Math.floor(index / 4)) % COLORS.chair.length];
  g.add(rbox(0.62, 0.1, 0.6, color, 0, 0.45, 0.95, 0.05));
  g.add(rbox(0.6, 0.62, 0.08, color, 0, 0.86, 1.27, 0.04));
  g.add(cyl(0.04, 0.04, 0.4, COLORS.chairBase, 0, 0.22, 0.95, 10));
  g.add(cyl(0.3, 0.3, 0.04, COLORS.chairBase, 0, 0.03, 0.95, 5));
  return g;
}

/** The whole room: slab, floor, two cut-away walls, work zone, lounge, bar, door, plants, lights. */
export function buildOffice(): Office {
  const group = new THREE.Group();
  const screens: THREE.MeshStandardMaterial[] = [];
  const disposables: { dispose: () => void }[] = [];

  const width = ROOM.maxX - ROOM.minX;
  const depth = ROOM.maxZ - ROOM.minZ;

  // A thick slab under the floor: the room reads as a diorama, like a build-mode lot.
  const slab = rbox(width + 1.2, 0.8, depth + 1.2, COLORS.slab, 0, -0.42, 0, 0.12, 0.9);
  slab.castShadow = false;
  group.add(slab);

  const woodTex = plankTexture(COLORS.floorWood, COLORS.floorWoodDark);
  const tileTex = tileTexture(COLORS.floorLounge, COLORS.floorLoungeDark);
  disposables.push(woodTex, tileTex);
  const splitX = CORRIDOR_X + 1.0;
  const work = new THREE.Mesh(new THREE.PlaneGeometry(splitX - ROOM.minX, depth), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 }));
  work.rotation.x = -Math.PI / 2;
  work.position.set((splitX + ROOM.minX) / 2, 0.001, 0);
  work.receiveShadow = true;
  group.add(work);
  const lounge = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.maxX - splitX, depth), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 }));
  lounge.rotation.x = -Math.PI / 2;
  lounge.position.set((ROOM.maxX + splitX) / 2, 0.001, 0);
  lounge.receiveShadow = true;
  group.add(lounge);
  const corridorStrip = rbox(1.6, 0.012, depth, COLORS.rugRing, CORRIDOR_X, 0.008, 0, 0.004, 0.9);
  corridorStrip.material = material(COLORS.corridor, 0.9);
  corridorStrip.castShadow = false;
  group.add(corridorStrip);

  // Walls: only the back and left ones, so the camera always looks into the room.
  const wallH = 4.2;
  const back = rbox(width + 0.6, wallH, 0.3, COLORS.wallBack, 0, wallH / 2, ROOM.minZ - 0.15, 0.03, 0.9);
  const left = rbox(0.3, wallH, depth + 0.6, COLORS.wallLeft, ROOM.minX - 0.15, wallH / 2, 0, 0.03, 0.9);
  group.add(back, left);
  group.add(rbox(width + 0.4, 0.22, 0.12, COLORS.baseboard, 0, 0.11, ROOM.minZ + 0.06, 0.02));
  group.add(rbox(0.12, 0.22, depth + 0.2, COLORS.baseboard, ROOM.minX + 0.06, 0.11, 0, 0.02));

  // Windows on the back wall, glowing a little so the room feels lit from outside too.
  const windowMat = new THREE.MeshStandardMaterial({ color: COLORS.window, emissive: COLORS.window, emissiveIntensity: 0.55, roughness: 0.2 });
  for (const wx of [-8, -4.2, -0.4]) {
    group.add(rbox(2.4, 1.8, 0.1, COLORS.windowFrame, wx, 2.5, ROOM.minZ + 0.04, 0.04));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.5), windowMat);
    pane.position.set(wx, 2.5, ROOM.minZ + 0.1);
    group.add(pane);
  }

  // Door, where people come in and go out.
  group.add(rbox(1.5, 3.1, 0.14, COLORS.doorFrame, CORRIDOR_X, 1.55, ROOM.minZ + 0.05, 0.03));
  group.add(rbox(1.2, 2.9, 0.16, COLORS.door, CORRIDOR_X, 1.5, ROOM.minZ + 0.1, 0.03));

  // The sign over the lounge.
  const sign = signTexture('STUDIO CM');
  disposables.push(sign);
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshBasicMaterial({ map: sign, transparent: true }));
  signMesh.position.set(7.3, 3.1, ROOM.minZ + 0.02);
  group.add(signMesh);

  // The mission board on the left wall: the real count of missions waiting at each of Ben's gates.
  const board = new THREE.Group();
  board.position.set(ROOM.minX + 0.04, 2.35, -2.5);
  board.rotation.y = Math.PI / 2;
  board.add(rbox(4.5, 2.5, 0.08, COLORS.boardFrame, 0, 0, 0, 0.03));
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024;
  boardCanvas.height = 560;
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.anisotropy = 4;
  disposables.push(boardTex);
  const boardCtx = boardCanvas.getContext('2d');
  const paintBoard = (counts: GateCounts | null) => {
    if (!boardCtx) return;
    drawBoard(boardCtx, boardCanvas.width, boardCanvas.height, counts);
    boardTex.needsUpdate = true;
  };
  paintBoard(null);
  const boardHit = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.35), new THREE.MeshBasicMaterial({ map: boardTex }));
  boardHit.position.set(0, 0, 0.05);
  board.add(boardHit);
  group.add(board);
  let lastCounts = '';

  // Work zone: a desk and a chair per place.
  for (let i = 0; i < DESK_COUNT; i++) group.add(deskUnit(i, screens));

  // Lounge: rug, sofa, coffee table, armchairs, lamp, bar, plants.
  const rug = cyl(2.9, 2.9, 0.03, COLORS.rug, 7.4, 0.02, -1.5, 48);
  rug.castShadow = false;
  group.add(rug);
  const ring = cyl(3.0, 3.0, 0.025, COLORS.rugRing, 7.4, 0.015, -1.5, 48);
  ring.castShadow = false;
  group.add(ring);
  group.add(sofa(7.5, -6.65, 4.4, COLORS.sofa, COLORS.sofaDark));
  group.add(cyl(0.45, 0.45, 0.4, COLORS.table, 7.5, 0.2, -4.2, 28));
  group.add(armchair(4.9, -1.0, Math.PI / 2));
  group.add(armchair(10.1, -2.0, -Math.PI / 2));

  const lampBase = new THREE.Group();
  lampBase.position.set(10.2, 0, -5.2);
  lampBase.add(cyl(0.22, 0.22, 0.05, COLORS.lampPole, 0, 0.025, 0, 16));
  lampBase.add(cyl(0.03, 0.03, 2.0, COLORS.lampPole, 0, 1.0, 0, 8));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.4, 20, 1, true), new THREE.MeshStandardMaterial({ color: COLORS.lampShade, emissive: COLORS.lampShade, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
  shade.position.set(0, 2.05, 0);
  lampBase.add(shade);
  group.add(lampBase);
  const lampLight = new THREE.PointLight(0xffd9a0, 18, 9, 1.6);
  lampLight.position.set(10.2, 2.0, -5.0);
  group.add(lampLight);

  // Coffee bar along the right wall.
  group.add(rbox(0.9, 1.0, 4.6, COLORS.counter, 10.45, 0.5, 4.0, 0.05));
  group.add(rbox(1.0, 0.08, 4.7, COLORS.counterTop, 10.45, 1.02, 4.0, 0.03));
  group.add(rbox(0.5, 0.55, 0.5, COLORS.machine, 10.5, 1.34, 2.9, 0.05));
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: COLORS.machineLight, emissive: COLORS.machineLight, emissiveIntensity: 1.5 }));
  light.position.set(10.22, 1.45, 2.9);
  group.add(light);
  for (const cz of [3.7, 4.0, 4.3]) group.add(cyl(0.07, 0.055, 0.12, COLORS.table, 10.3, 1.12, cz, 12));

  group.add(plant(-10.3, -7.3, 1.2), plant(-10.3, 7.2, 1.1), plant(10.3, -7.3, 1.2), plant(2.9 - 0.9, 7.3, 0.9), plant(10.3, 7.3, 1.1));

  const sun = new THREE.DirectionalLight(0xfff2de, 2.3);
  sun.position.set(-9, 18, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  const cam = sun.shadow.camera;
  cam.left = -15;
  cam.right = 15;
  cam.top = 12;
  cam.bottom = -12;
  cam.near = 2;
  cam.far = 50;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  group.add(sun, sun.target);

  group.add(new THREE.HemisphereLight(0xcfe2ff, 0x7a6450, 1.15));

  const target = new Float32Array(DESK_COUNT);
  const level = new Float32Array(DESK_COUNT);

  return {
    group,
    boardHit,
    setGateCounts(counts) {
      const key = counts ? `${counts.calendar}/${counts.qa}/${counts.send}` : 'none';
      if (key === lastCounts) return;
      lastCounts = key;
      paintBoard(counts);
    },
    lights: { sun },
    setDeskActive(index, active) {
      if (index >= 0 && index < DESK_COUNT) target[index] = active ? 1 : 0;
    },
    update(t) {
      for (let i = 0; i < DESK_COUNT; i++) {
        level[i] += (target[i] - level[i]) * 0.12;
        const m = screens[i];
        if (m) m.emissiveIntensity = level[i] * (0.85 + Math.sin(t * 2.3 + i) * 0.08);
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      for (const s of screens) s?.dispose();
      windowMat.dispose();
    },
  };
}
