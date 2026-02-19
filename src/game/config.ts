import type { GameConfig } from "./types";

export const DEFAULT_CONFIG: GameConfig = {
  roundDurationMs: 60_000,
  boardRows: 3,
  boardCols: 3,
  hitHideDurationMs: 120,
  timeoutHideDurationMs: 220,
  difficultyStepMs: 10_000,
  baseVisibleDurationMs: 1_150,
  minVisibleDurationMs: 480,
  visibleDurationStepMs: 115,
  baseSpawnDelayMinMs: 460,
  baseSpawnDelayMaxMs: 920,
  minSpawnDelayMinMs: 180,
  minSpawnDelayMaxMs: 370,
  spawnDelayMinStepMs: 36,
  spawnDelayMaxStepMs: 55
};
