/** Longest side after shrinking: plenty to read a label, small enough for a mobile connection. */
export const PHOTO_MAX_SIDE = 1600;

/** Size to draw a picture at so its longest side is at most `max`, keeping its proportions (pure, no DOM). */
export function fitSize(width: number, height: number, max: number = PHOTO_MAX_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}
