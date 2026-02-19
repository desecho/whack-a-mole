import "./styles.css";
import { Game } from "./game/Game";
import { DEFAULT_CONFIG } from "./game/config";
import type { GameState } from "./game/types";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const startButton = document.querySelector<HTMLButtonElement>("#start-btn");
const restartButton = document.querySelector<HTMLButtonElement>("#restart-btn");
const statusLabel = document.querySelector<HTMLParagraphElement>("#status");

if (!canvas || !startButton || !restartButton || !statusLabel) {
  throw new Error("Required game elements are missing from index.html.");
}

function createStatusText(state: GameState): string {
  if (state.status === "idle") {
    return "Press Start to begin. Whack as many moles as possible in 60 seconds.";
  }
  if (state.status === "running") {
    return "Game in progress. Tap or click visible moles to score points.";
  }
  return `Time's up. Final score: ${state.score}. Best score: ${state.bestScore}.`;
}

const game = new Game(canvas, DEFAULT_CONFIG, {
  onStateChange: (state) => {
    startButton.disabled = state.status === "running";
    restartButton.disabled = state.status === "idle";
    statusLabel.textContent = createStatusText(state);
  }
});

startButton.addEventListener("click", () => {
  game.start();
});

restartButton.addEventListener("click", () => {
  game.restart();
});

statusLabel.textContent = createStatusText(game.getState());

window.addEventListener("beforeunload", () => {
  game.destroy();
});

