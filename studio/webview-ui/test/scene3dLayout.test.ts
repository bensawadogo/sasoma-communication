import { describe, expect, it } from 'vitest';

import {
  advance,
  angleDelta,
  CORRIDOR_X,
  DESK_COUNT,
  deskSlot,
  DOOR_SLOT,
  firstFree,
  LOUNGE_SLOTS,
  loungeSlot,
  rerouteFrom,
  ROOM,
  routeBetween,
} from '../src/scene3d/layout.js';

describe('3D office floor plan', () => {
  it('gives every desk its own seat inside the room', () => {
    const seen = new Set<string>();
    for (let i = 0; i < DESK_COUNT; i++) {
      const s = deskSlot(i);
      seen.add(`${s.pos.x},${s.pos.z}`);
      expect(s.pos.x).toBeGreaterThan(ROOM.minX);
      expect(s.pos.x).toBeLessThan(CORRIDOR_X);
      expect(s.pos.z).toBeGreaterThan(ROOM.minZ);
      expect(s.pos.z).toBeLessThan(ROOM.maxZ);
    }
    expect(seen.size).toBe(DESK_COUNT);
  });

  it('keeps lounge places apart and inside the lounge', () => {
    for (const a of LOUNGE_SLOTS) {
      expect(a.pos.x).toBeGreaterThan(CORRIDOR_X);
      expect(a.pos.x).toBeLessThan(ROOM.maxX);
      for (const b of LOUNGE_SLOTS) {
        if (a !== b) expect(Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z)).toBeGreaterThan(1.0);
      }
    }
  });

  it('wraps indexes instead of failing when the office is full', () => {
    expect(deskSlot(DESK_COUNT).id).toBe(deskSlot(0).id);
    expect(loungeSlot(LOUNGE_SLOTS.length + 1).id).toBe(loungeSlot(1).id);
    expect(deskSlot(-1).id).toBe(deskSlot(DESK_COUNT - 1).id);
  });
});

describe('routes', () => {
  it('goes door -> corridor -> desk and ends on the seat', () => {
    const desk = deskSlot(5);
    const path = routeBetween(DOOR_SLOT, desk);
    expect(path[path.length - 1]).toMatchObject(desk.pos);
    // Every bend after the door's own lane is on the corridor, the desk's aisle, or the seat.
    for (const p of path) expect(p.x === CORRIDOR_X || p.z === desk.lane.z || p === path[path.length - 1] || p.x === desk.pos.x).toBe(true);
  });

  it('goes desk -> lounge by way of the corridor, never straight across the other desks', () => {
    const from = deskSlot(0);
    const to = loungeSlot(0);
    const path = routeBetween(from, to);
    const lanes = path.filter((p) => p.lane);
    expect(lanes).toHaveLength(2);
    expect(lanes.every((p) => p.x === CORRIDOR_X)).toBe(true);
    expect(path[path.length - 1]).toMatchObject(to.pos);
  });

  it('collapses duplicate points', () => {
    const path = routeBetween(loungeSlot(1), loungeSlot(1));
    for (let i = 1; i < path.length; i++) {
      expect(path[i].x === path[i - 1].x && path[i].z === path[i - 1].z).toBe(false);
    }
  });
});

describe('advance', () => {
  it('moves along the path and reports the heading', () => {
    const w = advance({ x: 0, z: 0 }, [{ x: 0, z: 10 }], 4);
    expect(w.pos).toEqual({ x: 0, z: 4 });
    expect(w.arrived).toBe(false);
    expect(w.heading).toBeCloseTo(0);
  });

  it('turns the corner within one step and arrives', () => {
    const w = advance({ x: 0, z: 0 }, [{ x: 0, z: 2 }, { x: 3, z: 2 }], 10);
    expect(w.pos).toEqual({ x: 3, z: 2 });
    expect(w.arrived).toBe(true);
  });

  it('does not move when asked for nothing', () => {
    const w = advance({ x: 1, z: 1 }, [{ x: 5, z: 5 }], 0);
    expect(w.pos).toEqual({ x: 1, z: 1 });
    expect(w.heading).toBeNull();
  });
});

describe('rerouteFrom', () => {
  it('keeps heading to the next lane when the walker has not reached it', () => {
    const from = deskSlot(0);
    const first = routeBetween(DOOR_SLOT, from);
    const next = rerouteFrom({ x: CORRIDOR_X, z: -2 }, first, from, loungeSlot(0));
    expect(next[next.length - 1]).toMatchObject(loungeSlot(0).pos);
    expect(next.some((p) => p.lane)).toBe(true);
  });

  it('backs out of the old approach when the walker is already past the lane', () => {
    const sofa = loungeSlot(0);
    const nextPath = rerouteFrom({ x: 6.2, z: -4 }, [sofa.pos], sofa, deskSlot(2));
    expect(nextPath[0]).toMatchObject({ x: 6.2, z: -3.0 });
    expect(nextPath[nextPath.length - 1]).toMatchObject(deskSlot(2).pos);
  });
});

describe('helpers', () => {
  it('picks the first free index in a given order', () => {
    expect(firstFree([2, 0, 1], new Set([2]))).toBe(0);
    expect(firstFree([0], new Set([0]))).toBeNull();
  });

  it('takes the short way round an angle', () => {
    expect(angleDelta(0, Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2);
    expect(angleDelta(Math.PI * 0.9, -Math.PI * 0.9)).toBeCloseTo(Math.PI * 0.2);
  });
});
