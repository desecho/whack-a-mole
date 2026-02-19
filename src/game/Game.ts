import { DEFAULT_CONFIG } from "./config";
import { findHitMoleId, eventToCanvasPoint } from "./input";
import { randomSpawnDelay } from "./random";
import { createHoles, renderGame, resizeCanvasToDisplaySize } from "./renderer";
import {
  computeDifficulty,
  computeTimeLeftMs,
  createInitialState,
  expireMoles,
  removeMoleById,
  trySpawnOneMole
} from "./state";
import { getBestScore, setBestScore } from "./storage";
import type { GameConfig, GameState, Hole } from "./types";

interface GameOptions {
  onStateChange?: (state: GameState) => void;
  random?: () => number;
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly config: GameConfig;
  private readonly onStateChange?: (state: GameState) => void;
  private readonly random: () => number;

  private state: GameState;
  private holes: Hole[] = [];
  private frameHandle: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig = DEFAULT_CONFIG,
    options: GameOptions = {}
  ) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas context is not available.");
    }

    this.canvas = canvas;
    this.context = context;
    this.config = config;
    this.onStateChange = options.onStateChange;
    this.random = options.random ?? Math.random;
    this.state = createInitialState(getBestScore(), config);

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("resize", this.handleResize);

    this.renderCurrentState();
    this.emitState();
  }

  public getState(): GameState {
    return {
      ...this.state,
      activeMoles: [...this.state.activeMoles]
    };
  }

  public start(): void {
    if (this.state.status === "running") {
      return;
    }
    this.beginRound();
  }

  public restart(): void {
    this.beginRound();
  }

  public destroy(): void {
    this.stopLoop();
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("resize", this.handleResize);
  }

  private beginRound(): void {
    const nowMs = performance.now();
    this.state = {
      ...createInitialState(this.state.bestScore, this.config),
      status: "running",
      roundStartMs: nowMs,
      timeLeftMs: this.config.roundDurationMs,
      difficulty: computeDifficulty(0, this.config),
      nextSpawnAtMs: 0
    };
    this.emitState();
    this.renderCurrentState();
    this.startLoop();
  }

  private startLoop(): void {
    if (this.frameHandle !== null) {
      return;
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  private stopLoop(): void {
    if (this.frameHandle === null) {
      return;
    }
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  private frame = (nowMs: number): void => {
    if (this.state.status !== "running") {
      this.frameHandle = null;
      this.renderCurrentState();
      return;
    }

    this.update(nowMs);
    this.renderCurrentState();

    if (this.state.status === "running") {
      this.frameHandle = requestAnimationFrame(this.frame);
    } else {
      this.frameHandle = null;
    }
  };

  private update(nowMs: number): void {
    if (this.state.roundStartMs === null) {
      return;
    }

    const elapsedMs = Math.max(0, nowMs - this.state.roundStartMs);
    const nextDifficulty = computeDifficulty(elapsedMs, this.config);
    const remainingMs = computeTimeLeftMs(
      this.state.roundStartMs,
      nowMs,
      this.config.roundDurationMs
    );

    this.state = {
      ...this.state,
      difficulty: nextDifficulty,
      timeLeftMs: remainingMs,
      activeMoles: expireMoles(this.state.activeMoles, nowMs)
    };

    if (remainingMs <= 0) {
      this.finishRound();
      return;
    }

    this.state = this.reconcileSpawning(this.state, nowMs);
  }

  private reconcileSpawning(state: GameState, nowMs: number): GameState {
    const cap = state.difficulty.maxConcurrentMoles;
    if (state.activeMoles.length >= cap) {
      if (state.nextSpawnAtMs !== 0) {
        return { ...state, nextSpawnAtMs: 0 };
      }
      return state;
    }

    if (state.nextSpawnAtMs <= 0) {
      return {
        ...state,
        nextSpawnAtMs: nowMs + randomSpawnDelay(state.difficulty, this.random)
      };
    }

    if (nowMs < state.nextSpawnAtMs) {
      return state;
    }

    const spawnedState = trySpawnOneMole(state, nowMs, this.config, this.random);
    return {
      ...spawnedState,
      nextSpawnAtMs: 0
    };
  }

  private finishRound(): void {
    let bestScore = this.state.bestScore;
    if (this.state.score > bestScore) {
      bestScore = this.state.score;
      setBestScore(bestScore);
    }

    this.state = {
      ...this.state,
      status: "gameOver",
      roundStartMs: null,
      timeLeftMs: 0,
      nextSpawnAtMs: 0,
      activeMoles: [],
      bestScore
    };
    this.emitState();
    this.stopLoop();
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.state.status !== "running") {
      return;
    }

    event.preventDefault();
    const point = eventToCanvasPoint(event, this.canvas);
    const hitMoleId = findHitMoleId(point, this.state.activeMoles, this.holes);
    if (!hitMoleId) {
      return;
    }

    this.state = {
      ...this.state,
      score: this.state.score + 1,
      activeMoles: removeMoleById(this.state.activeMoles, hitMoleId),
      nextSpawnAtMs: 0
    };
    this.emitState();
    this.renderCurrentState();
  };

  private handleResize = (): void => {
    this.renderCurrentState();
  };

  private renderCurrentState(): void {
    const viewport = resizeCanvasToDisplaySize(this.canvas, this.context);
    this.holes = createHoles(
      viewport.width,
      viewport.height,
      this.config.boardRows,
      this.config.boardCols
    );
    renderGame(this.context, viewport.width, viewport.height, this.state, this.holes);
  }

  private emitState(): void {
    if (!this.onStateChange) {
      return;
    }
    this.onStateChange(this.getState());
  }
}

