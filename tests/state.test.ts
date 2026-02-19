import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/game/config";
import {
  advanceMoleLifecycle,
  applyHitToMole,
  computeConcurrencyCap,
  computeDifficulty,
  computeTimeLeftMs,
  createInitialState,
  getAvailableHoleIds,
  trySpawnOneMole
} from "../src/game/state";
import type { ActiveMole } from "../src/game/types";

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

describe("advanceMoleLifecycle", () => {
  it("transitions timed-out moles into hiding and then removes them", () => {
    const timedOutMole: ActiveMole = {
      id: "m1",
      holeId: 0,
      shownAtMs: 0,
      hideAtMs: 100,
      state: "up",
      hideStartedAtMs: null,
      hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
      hideReason: null,
      wasHit: false
    };

    const transitioned = advanceMoleLifecycle([timedOutMole], 120, DEFAULT_CONFIG);
    expect(transitioned).toEqual([
      {
        ...timedOutMole,
        state: "hiding",
        hideStartedAtMs: 100,
        hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
        hideReason: "timeout"
      }
    ]);

    const removed = advanceMoleLifecycle(
      transitioned,
      100 + DEFAULT_CONFIG.timeoutHideDurationMs,
      DEFAULT_CONFIG
    );
    expect(removed).toEqual([]);
  });
});

describe("applyHitToMole", () => {
  it("awards one point and sets hit-hide animation when mole is up", () => {
    const upMole: ActiveMole = {
      id: "m1",
      holeId: 0,
      shownAtMs: 0,
      hideAtMs: 500,
      state: "up",
      hideStartedAtMs: null,
      hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
      hideReason: null,
      wasHit: false
    };

    const result = applyHitToMole([upMole], "m1", 80, DEFAULT_CONFIG);
    expect(result.awardedPoint).toBe(true);
    expect(result.activeMoles[0]).toMatchObject({
      id: "m1",
      state: "hiding",
      hideStartedAtMs: 80,
      hideDurationMs: DEFAULT_CONFIG.hitHideDurationMs,
      hideReason: "hit",
      wasHit: true
    });
  });

  it("allows scoring once during timeout-hide without restarting hide animation", () => {
    const hidingTimeoutMole: ActiveMole = {
      id: "m2",
      holeId: 1,
      shownAtMs: 0,
      hideAtMs: 100,
      state: "hiding",
      hideStartedAtMs: 100,
      hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
      hideReason: "timeout",
      wasHit: false
    };

    const firstHit = applyHitToMole([hidingTimeoutMole], "m2", 140, DEFAULT_CONFIG);
    expect(firstHit.awardedPoint).toBe(true);
    expect(firstHit.activeMoles[0]).toMatchObject({
      id: "m2",
      state: "hiding",
      hideStartedAtMs: 100,
      hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
      hideReason: "hit",
      wasHit: true
    });

    const secondHit = applyHitToMole(firstHit.activeMoles, "m2", 145, DEFAULT_CONFIG);
    expect(secondHit.awardedPoint).toBe(false);
  });
});

describe("getAvailableHoleIds", () => {
  it("keeps hole blocked while mole is hiding", () => {
    const hidingMole: ActiveMole = {
      id: "m3",
      holeId: 2,
      shownAtMs: 0,
      hideAtMs: 120,
      state: "hiding",
      hideStartedAtMs: 120,
      hideDurationMs: DEFAULT_CONFIG.timeoutHideDurationMs,
      hideReason: "timeout",
      wasHit: false
    };

    expect(getAvailableHoleIds(4, [hidingMole])).toEqual([0, 1, 3]);
  });
});

describe("computeTimeLeftMs", () => {
  it("clamps remaining time at zero after round duration", () => {
    expect(computeTimeLeftMs(null, 5_000, 60_000)).toBe(60_000);
    expect(computeTimeLeftMs(1_000, 40_000, 60_000)).toBe(21_000);
    expect(computeTimeLeftMs(1_000, 90_000, 60_000)).toBe(0);
  });
});
