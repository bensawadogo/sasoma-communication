import { describe, expect, it } from 'vitest';

import { fitSize, PHOTO_MAX_SIDE } from '../src/chat/photoSize.js';

describe('fitSize', () => {
  it('leaves a small photo alone', () => {
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('shrinks a phone photo so its longest side fits, keeping its proportions', () => {
    expect(fitSize(4032, 3024)).toEqual({ width: PHOTO_MAX_SIDE, height: 1200 });
    expect(fitSize(3024, 4032)).toEqual({ width: 1200, height: PHOTO_MAX_SIDE });
  });
  it('never returns a zero side', () => {
    expect(fitSize(100000, 1).height).toBe(1);
  });
});
