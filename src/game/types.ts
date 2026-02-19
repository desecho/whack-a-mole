export type GameStatus = "idle" | "running" | "gameOver";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Hole {
  id: number;
  center: Vec2;
  radius: number;
}

export interface ActiveMole {
  id: string;
  holeId: number;
  shownAtMs: number;
  hideAtMs: number;
}

export interface DifficultyState {
  level: number;
  maxConcurrentMoles: 1 | 2 | 3;
  visibleDurationMs: number;
  spawnDelayMinMs: number;
  spawnDelayMaxMs: number;
}

export interface GameConfig {
  roundDurationMs: number;
  boardRows: number;
  boardCols: number;
  difficultyStepMs: number;
  baseVisibleDurationMs: number;
  minVisibleDurationMs: number;
  visibleDurationStepMs: number;
  baseSpawnDelayMinMs: number;
  baseSpawnDelayMaxMs: number;
  minSpawnDelayMinMs: number;
  minSpawnDelayMaxMs: number;
  spawnDelayMinStepMs: number;
  spawnDelayMaxStepMs: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  bestScore: number;
  timeLeftMs: number;
  roundStartMs: number | null;
  nextSpawnAtMs: number;
  activeMoles: ActiveMole[];
  difficulty: DifficultyState;
}

