import type { ActiveMole, Hole } from "./types";

const BASE_MOLE_CENTER_Y_MULTIPLIER = -0.34;
const HIDE_DROP_MULTIPLIER = 1.62;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeInQuad(value: number): number {
  return value * value;
}

export function getMoleHideProgress(mole: ActiveMole, nowMs: number): number {
  if (mole.state !== "hiding" || mole.hideStartedAtMs === null) {
    return 0;
  }
  if (mole.hideDurationMs <= 0) {
    return 1;
  }
  return clamp01((nowMs - mole.hideStartedAtMs) / mole.hideDurationMs);
}

export function getMoleCenter(hole: Hole, mole: ActiveMole, nowMs: number): {
  x: number;
  y: number;
} {
  const hideProgress = getMoleHideProgress(mole, nowMs);
  const downOffset = easeInQuad(hideProgress) * hole.radius * HIDE_DROP_MULTIPLIER;
  return {
    x: hole.center.x,
    y: hole.center.y + hole.radius * BASE_MOLE_CENTER_Y_MULTIPLIER + downOffset
  };
}

