/** Every colour of the 3D office, in one place (this folder is exempt from the inline-colour rule). */

export const COLORS = {
  backdrop: 0x14203a,
  slab: 0x2a3350,
  wallBack: 0xe3e9f3,
  wallLeft: 0xcdd6e6,
  baseboard: 0x8d99b4,
  floorWood: 0xc79a62,
  floorWoodDark: 0xb78850,
  floorLounge: 0xe6d9c4,
  floorLoungeDark: 0xd8c8ae,
  rug: 0x3f7fd1,
  rugRing: 0xf2c04b,
  corridor: 0xb7c3de,
  desk: 0xf3efe6,
  deskLeg: 0x6f7a92,
  monitorBody: 0x20263a,
  screenOff: 0x1a2236,
  screenOn: 0x6fc4ff,
  keyboard: 0x39425c,
  mug: 0xff7a59,
  chair: [0x2f6fed, 0x1fa97a, 0xe0694d, 0x8a5cf0] as readonly number[],
  chairBase: 0x30384f,
  sofa: 0xf0735f,
  sofaDark: 0xd95c49,
  armchair: 0x3fa8a0,
  table: 0xf6f1e5,
  lampPole: 0x4a5268,
  lampShade: 0xffe4a6,
  counter: 0xf5f5f7,
  counterTop: 0x4b5578,
  machine: 0x2b3249,
  machineLight: 0x58e29a,
  plantPot: 0xd98f56,
  plantLeaf: 0x3fb36b,
  plantLeaf2: 0x2c9a58,
  window: 0xa9d8ff,
  windowFrame: 0xf8fafc,
  door: 0x4b5578,
  doorFrame: 0xf8fafc,
  boardFrame: 0x6f7a92,
  boardPaper: 0xffffff,
  boardPaperHex: '#ffffff',
  boardInk: '#2a3350',
  boardIdle: '#e9edf5',
  boardTextOn: '#ffffff',
  boardTextOff: '#8a94ad',
  boardCols: ['#2f6fed', '#e0694d', '#1fa97a'] as readonly string[],
  signText: '#ffffff',
  signBack: '#2f6fed',
  labelBack: 'rgba(20, 28, 52, 0.86)',
  labelText: '#ffffff',
  labelSub: '#b8c4e6',
  labelWorking: '#5be08c',
  labelWaiting: '#ffb347',
  plumbWorking: 0x34e07a,
  plumbWaiting: 0xffa733,
  hair: [0x14100e, 0x1d1511, 0x2a1d14] as readonly number[],
  skin: [0x8d5a3b, 0x6f4428, 0xa86d48, 0x5a3a25, 0xc08a62] as readonly number[],
  pants: [0x2d3556, 0x3b3f4f, 0x4a3b32] as readonly number[],
  shirt: [0x2f6fed, 0xe0694d, 0x1fa97a, 0x8a5cf0, 0xf2b134, 0xe2578f, 0x2fb5c9, 0x7a8b3a, 0xc0562b, 0x4a5cc4, 0x1e8f9a] as readonly number[],
  shoe: 0x20232f,
  eye: 0x141414,
  helperAccent: 0xffd25e,
  shadowGround: 0x000000,
} as const;

/** A stable small number from a name or id, so the same agent always wears the same clothes. */
export function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(list: readonly T[], seed: number, salt = 0): T {
  return list[(seed + salt * 7919) % list.length];
}
