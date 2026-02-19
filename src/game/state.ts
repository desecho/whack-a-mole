import { randomIntInclusive } from "./random";
import type { ActiveMole, DifficultyState, GameConfig, GameState } from "./types";

export function computeConcurrencyCap(elapsedMs: number): 1 | 2 | 3 {
  if (elapsedMs >= 40_000) {
    return 3;
  }
  if (elapsedMs >= 20_000) {
    return 2;
  }
  return 1;
}

export function computeDifficulty(
  elapsedMs: number,
  config: GameConfig
): DifficultyState {
  const level = Math.max(0, Math.floor(elapsedMs / config.difficultyStepMs));
  const visibleDurationMs = Math.max(
    config.minVisibleDurationMs,
    config.baseVisibleDurationMs - level * config.visibleDurationStepMs
  );
  const spawnDelayMinMs = Math.max(
    config.minSpawnDelayMinMs,
    config.baseSpawnDelayMinMs - level * config.spawnDelayMinStepMs
  );
  const provisionalSpawnDelayMaxMs = Math.max(
    config.minSpawnDelayMaxMs,
    config.baseSpawnDelayMaxMs - level * config.spawnDelayMaxStepMs
  );
  const spawnDelayMaxMs = Math.max(spawnDelayMinMs, provisionalSpawnDelayMaxMs);

  return {
    level,
    maxConcurrentMoles: computeConcurrencyCap(elapsedMs),
    visibleDurationMs,
    spawnDelayMinMs,
    spawnDelayMaxMs
  };
}

export function createInitialState(
  bestScore: number,
  config: GameConfig
): GameState {
  return {
    status: "idle",
    score: 0,
    bestScore,
    timeLeftMs: config.roundDurationMs,
    roundStartMs: null,
    nextSpawnAtMs: 0,
    activeMoles: [],
    difficulty: computeDifficulty(0, config)
  };
}

export function computeTimeLeftMs(
  roundStartMs: number | null,
  nowMs: number,
  roundDurationMs: number
): number {
  if (roundStartMs === null) {
    return roundDurationMs;
  }
  const elapsed = Math.max(0, nowMs - roundStartMs);
  return Math.max(0, roundDurationMs - elapsed);
}

export function advanceMoleLifecycle(
  activeMoles: ActiveMole[],
  nowMs: number,
  config: GameConfig
): ActiveMole[] {
  const advanced = activeMoles.map((mole) => {
    if (mole.state === "up" && nowMs >= mole.hideAtMs) {
      return {
        ...mole,
        state: "hiding" as const,
        hideStartedAtMs: mole.hideAtMs,
        hideDurationMs: config.timeoutHideDurationMs,
        hideReason: "timeout" as const
      };
    }
    return mole;
  });

  return advanced.filter((mole) => {
    if (mole.state !== "hiding") {
      return true;
    }
    const startedAt = mole.hideStartedAtMs ?? nowMs;
    return nowMs < startedAt + mole.hideDurationMs;
  });
}

export function applyHitToMole(
  activeMoles: ActiveMole[],
  moleId: string,
  nowMs: number,
  config: GameConfig
): { activeMoles: ActiveMole[]; awardedPoint: boolean } {
  const index = activeMoles.findIndex((mole) => mole.id === moleId);
  if (index < 0) {
    return {
      activeMoles,
      awardedPoint: false
    };
  }

  const target = activeMoles[index];
  if (target.wasHit) {
    return {
      activeMoles,
      awardedPoint: false
    };
  }

  let updatedTarget: ActiveMole;
  if (target.state === "hiding") {
    updatedTarget = {
      ...target,
      wasHit: true,
      hideReason: "hit"
    };
  } else {
    updatedTarget = {
      ...target,
      wasHit: true,
      state: "hiding",
      hideStartedAtMs: nowMs,
      hideDurationMs: config.hitHideDurationMs,
      hideReason: "hit"
    };
  }

  const nextMoles = [...activeMoles];
  nextMoles[index] = updatedTarget;
  return {
    activeMoles: nextMoles,
    awardedPoint: true
  };
}

export function getAvailableHoleIds(
  totalHoles: number,
  activeMoles: ActiveMole[]
): number[] {
  const occupied = new Set(activeMoles.map((mole) => mole.holeId));
  const available: number[] = [];
  for (let holeId = 0; holeId < totalHoles; holeId += 1) {
    if (!occupied.has(holeId)) {
      available.push(holeId);
    }
  }
  return available;
}

function createMoleId(nowMs: number, holeId: number, random: () => number): string {
  const entropy = Math.floor(random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  return `${nowMs.toFixed(0)}-${holeId}-${entropy}`;
}

export function trySpawnOneMole(
  state: GameState,
  nowMs: number,
  config: GameConfig,
  random: () => number = Math.random
): GameState {
  if (state.activeMoles.length >= state.difficulty.maxConcurrentMoles) {
    return state;
  }

  const totalHoles = config.boardRows * config.boardCols;
  const availableHoleIds = getAvailableHoleIds(totalHoles, state.activeMoles);
  if (availableHoleIds.length === 0) {
    return state;
  }

  const randomIndex = randomIntInclusive(0, availableHoleIds.length - 1, random);
  const holeId = availableHoleIds[randomIndex];
  const newMole: ActiveMole = {
    id: createMoleId(nowMs, holeId, random),
    holeId,
    shownAtMs: nowMs,
    hideAtMs: nowMs + state.difficulty.visibleDurationMs,
    state: "up",
    hideStartedAtMs: null,
    hideDurationMs: config.timeoutHideDurationMs,
    hideReason: null,
    wasHit: false
  };

  return {
    ...state,
    activeMoles: [...state.activeMoles, newMole]
  };
}
