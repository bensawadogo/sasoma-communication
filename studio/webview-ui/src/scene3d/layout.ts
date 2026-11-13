/**
 * The 3D office's floor plan and walking rules, with no three.js in it so it can be tested in plain Node.
 *
 * World units are metres, x to the right, z toward the viewer, y up. A character's front is +z at yaw 0.
 * Everyone walks along one corridor (x = CORRIDOR_X) between the work zone (desks, west) and the lounge
 * (the "salon", east): a slot is a place to be, its `lane` is where its path leaves the corridor, and its
 * `approach` is the few bends between that lane and the spot.
 */

export interface Vec {
  x: number;
  z: number;
}

export type Pose = 'type' | 'sit' | 'stand';
export type SlotKind = 'desk' | 'lounge' | 'door';

export interface Slot {
  id: string;
  kind: SlotKind;
  pos: Vec;
  /** Direction the character faces there, in radians around y (0 = +z, PI/2 = +x). */
  yaw: number;
  pose: Pose;
  /** Seat height the body sinks to when seated (0 when standing). */
  seatY: number;
  /** Where the path joins the corridor. */
  lane: Vec;
  /** Points between the lane and the spot, in walking order from the lane. */
  approach: Vec[];
}

export interface Waypoint extends Vec {
  /** True for the corridor entry points: a walker heading elsewhere keeps going to the next one. */
  lane?: boolean;
}

export const CORRIDOR_X = 2.8;
export const ROOM = { minX: -11, maxX: 11, minZ: -8, maxZ: 8 } as const;

export const DESK_COLUMNS = [-8.5, -5.5, -2.5, 0.2] as const;
export const DESK_ROWS = [-5.4, -1.6, 2.2] as const;
export const DESK_COUNT = DESK_COLUMNS.length * DESK_ROWS.length;

/** Chair-to-desk offset: the person sits this far in front of the desk's centre line. */
export const SEAT_OFFSET_Z = 0.95;
/** How far past the desk row the corridor-side aisle runs. */
const AISLE_OFFSET_Z = 2.3;

export function deskCenter(index: number): Vec {
  const i = ((index % DESK_COUNT) + DESK_COUNT) % DESK_COUNT;
  return { x: DESK_COLUMNS[i % DESK_COLUMNS.length], z: DESK_ROWS[Math.floor(i / DESK_COLUMNS.length)] };
}

export function deskSlot(index: number): Slot {
  const i = ((index % DESK_COUNT) + DESK_COUNT) % DESK_COUNT;
  const c = deskCenter(i);
  const aisleZ = c.z + AISLE_OFFSET_Z;
  return {
    id: `desk-${i}`,
    kind: 'desk',
    pos: { x: c.x, z: c.z + SEAT_OFFSET_Z },
    yaw: Math.PI,
    pose: 'type',
    seatY: 0.4,
    lane: { x: CORRIDOR_X, z: aisleZ },
    approach: [{ x: c.x, z: aisleZ }],
  };
}

export const DOOR_SLOT: Slot = {
  id: 'door',
  kind: 'door',
  pos: { x: CORRIDOR_X, z: -7.2 },
  yaw: 0,
  pose: 'stand',
  seatY: 0,
  lane: { x: CORRIDOR_X, z: -7.2 },
  approach: [],
};

const stand = (id: string, x: number, z: number, yaw: number): Slot => ({
  id,
  kind: 'lounge',
  pos: { x, z },
  yaw,
  pose: 'stand',
  seatY: 0,
  lane: { x: CORRIDOR_X, z },
  approach: [],
});

/**
 * The lounge's places, in the order they fill: the first agents take the sofa and the armchairs, the next
 * stand at the coffee bar and chat. Every straight lane (same z) is clear of furniture and of the other lanes.
 */
export const LOUNGE_SLOTS: readonly Slot[] = [
  { id: 'sofa-left', kind: 'lounge', pos: { x: 6.2, z: -6.0 }, yaw: 0, pose: 'sit', seatY: 0.4, lane: { x: CORRIDOR_X, z: -3.0 }, approach: [{ x: 6.2, z: -3.0 }] },
  { id: 'chair-west', kind: 'lounge', pos: { x: 5.2, z: -1.0 }, yaw: Math.PI / 2, pose: 'sit', seatY: 0.4, lane: { x: CORRIDOR_X, z: -1.0 }, approach: [] },
  stand('bar-1', 9.7, 2.8, Math.PI / 2),
  { id: 'sofa-right', kind: 'lounge', pos: { x: 8.8, z: -6.0 }, yaw: 0, pose: 'sit', seatY: 0.4, lane: { x: CORRIDOR_X, z: -3.0 }, approach: [{ x: 8.8, z: -3.0 }] },
  stand('chat-1', 6.2, 0.4, Math.PI / 2),
  { id: 'chair-east', kind: 'lounge', pos: { x: 9.8, z: -2.0 }, yaw: -Math.PI / 2, pose: 'sit', seatY: 0.4, lane: { x: CORRIDOR_X, z: -2.0 }, approach: [] },
  stand('bar-2', 9.7, 4.0, Math.PI / 2),
  stand('chat-2', 8.0, 1.6, -Math.PI / 2),
  stand('bar-3', 9.7, 5.2, Math.PI / 2),
  stand('rest-1', 6.5, 6.4, 0),
];

export function loungeSlot(index: number): Slot {
  return LOUNGE_SLOTS[((index % LOUNGE_SLOTS.length) + LOUNGE_SLOTS.length) % LOUNGE_SLOTS.length];
}

const near = (a: Vec, b: Vec, eps = 1e-6) => Math.abs(a.x - b.x) < eps && Math.abs(a.z - b.z) < eps;

function dedupe(points: Waypoint[]): Waypoint[] {
  const out: Waypoint[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && near(last, p)) {
      if (p.lane) last.lane = true;
      continue;
    }
    out.push({ ...p });
  }
  return out;
}

/** The way from a slot to another: out of the first, along the corridor, into the second. */
export function routeBetween(from: Slot, to: Slot): Waypoint[] {
  const out = [...from.approach].reverse();
  return dedupe([
    ...out,
    { ...from.lane, lane: true },
    { ...to.lane, lane: true },
    ...to.approach,
    to.pos,
  ]);
}

/**
 * A new path for someone already walking to (or standing in) `current`, from where they are. Past the lane
 * they back out of the old approach first; before it they just keep going to the lane.
 */
export function rerouteFrom(position: Vec, remaining: Waypoint[], current: Slot, to: Slot): Waypoint[] {
  const laneIndex = remaining.findIndex((p) => p.lane);
  const head: Waypoint[] =
    laneIndex >= 0
      ? remaining.slice(0, laneIndex + 1)
      : [...[...current.approach].reverse(), { ...current.lane, lane: true }];
  const lane: Waypoint = { ...to.lane, lane: true };
  const path = dedupe([...head.filter((p) => !near(p, position)), lane, ...to.approach, to.pos]);
  return path;
}

export interface Walk {
  pos: Vec;
  path: Waypoint[];
  /** Direction of travel in radians around y, or null when nothing moved. */
  heading: number | null;
  arrived: boolean;
}

/** Moves `distance` metres along the path. */
export function advance(pos: Vec, path: readonly Waypoint[], distance: number): Walk {
  let p = { x: pos.x, z: pos.z };
  const rest = path.map((w) => ({ ...w }));
  let left = distance;
  let heading: number | null = null;
  while (rest.length > 0 && left > 0) {
    const next = rest[0];
    const dx = next.x - p.x;
    const dz = next.z - p.z;
    const len = Math.hypot(dx, dz);
    if (len > 1e-9) heading = Math.atan2(dx, dz);
    if (len <= left) {
      p = { x: next.x, z: next.z };
      left -= len;
      rest.shift();
    } else {
      p = { x: p.x + (dx / len) * left, z: p.z + (dz / len) * left };
      left = 0;
    }
  }
  return { pos: p, path: rest, heading, arrived: rest.length === 0 };
}

/** The first free index in `order`, or null when every one is taken. */
export function firstFree(order: readonly number[], taken: ReadonlySet<number>): number | null {
  for (const i of order) if (!taken.has(i)) return i;
  return null;
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
