import type { DifficultyState } from "./types";

export function randomIntInclusive(
  min: number,
  max: number,
  random: () => number = Math.random
): number {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  if (safeMin === safeMax) {
    return safeMin;
  }
  return Math.floor(random() * (safeMax - safeMin + 1)) + safeMin;
}

export function randomSpawnDelay(
  difficulty: DifficultyState,
  random: () => number = Math.random
): number {
  return randomIntInclusive(
    difficulty.spawnDelayMinMs,
    difficulty.spawnDelayMaxMs,
    random
  );
}

