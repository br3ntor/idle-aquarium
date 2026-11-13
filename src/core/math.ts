export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function moveToward(
  current: number,
  target: number,
  maxDelta: number,
): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(angle: number): number {
  const tau = Math.PI * 2;
  return ((((angle + Math.PI) % tau) + tau) % tau) - Math.PI;
}

/** Turn `current` toward `target` without ever exceeding `maxStep`. */
export function turnToward(
  current: number,
  target: number,
  maxStep: number,
): number {
  const difference = wrapAngle(target - current);
  if (Math.abs(difference) <= maxStep) return target;
  return current + Math.sign(difference) * maxStep;
}

export function distanceSquared(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}
