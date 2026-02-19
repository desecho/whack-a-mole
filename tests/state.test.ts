import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/game/config";
import {
  computeConcurrencyCap,
  computeDifficulty,
  computeTimeLeftMs,
  createInitialState,
  expireMoles,
  trySpawnOneMole
} from "../src/game/state";

describe("computeConcurrencyCap", () => {
  it("ramps from 1 to 2 to 3 at the expected time thresholds", () => {
    expect(computeConcurrencyCap(0)).toBe(1);
    expect(computeConcurrencyCap(19_999)).toBe(1);
    expect(computeConcurrencyCap(20_000)).toBe(2);
    expect(computeConcurrencyCap(39_999)).toBe(2);
    expect(computeConcurrencyCap(40_000)).toBe(3);
  });
});

describe("computeDifficulty", () => {
  it("tightens timing as levels increase and respects minimum values", () => {
    const levelZero = computeDifficulty(0, DEFAULT_CONFIG);
    const levelThree = computeDifficulty(30_000, DEFAULT_CONFIG);
    const veryLate = computeDifficulty(999_000, DEFAULT_CONFIG);

    expect(levelThree.level).toBe(3);
    expect(levelThree.visibleDurationMs).toBeLessThan(levelZero.visibleDurationMs);
    expect(levelThree.spawnDelayMinMs).toBeLessThan(levelZero.spawnDelayMinMs);
    expect(veryLate.visibleDurationMs).toBe(DEFAULT_CONFIG.minVisibleDurationMs);
    expect(veryLate.spawnDelayMinMs).toBe(DEFAULT_CONFIG.minSpawnDelayMinMs);
    expect(veryLate.spawnDelayMaxMs).toBeGreaterThanOrEqual(veryLate.spawnDelayMinMs);
  });
});

describe("trySpawnOneMole", () => {
  it("never exceeds cap and never duplicates occupied holes", () => {
    let state = createInitialState(0, DEFAULT_CONFIG);
    state = {
      ...state,
      status: "running",
      roundStartMs: 0,
      difficulty: { ...state.difficulty, maxConcurrentMoles: 2 }
    };

    state = trySpawnOneMole(state, 0, DEFAULT_CONFIG, () => 0);
    state = trySpawnOneMole(state, 100, DEFAULT_CONFIG, () => 0);
    state = trySpawnOneMole(state, 200, DEFAULT_CONFIG, () => 0);

    expect(state.activeMoles).toHaveLength(2);
    expect(new Set(state.activeMoles.map((mole) => mole.holeId)).size).toBe(2);
  });
});

describe("expireMoles", () => {
  it("removes only moles whose hideAtMs has elapsed", () => {
    const remaining = expireMoles(
      [
        { id: "m1", holeId: 0, shownAtMs: 0, hideAtMs: 100 },
        { id: "m2", holeId: 1, shownAtMs: 10, hideAtMs: 200 }
      ],
      120
    );

    expect(remaining).toEqual([
      { id: "m2", holeId: 1, shownAtMs: 10, hideAtMs: 200 }
    ]);
  });
});

describe("computeTimeLeftMs", () => {
  it("clamps remaining time at zero after round duration", () => {
    expect(computeTimeLeftMs(null, 5_000, 60_000)).toBe(60_000);
    expect(computeTimeLeftMs(1_000, 40_000, 60_000)).toBe(21_000);
    expect(computeTimeLeftMs(1_000, 90_000, 60_000)).toBe(0);
  });
});

