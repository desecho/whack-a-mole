import type { GameState, Hole } from "./types";

interface CanvasViewport {
  width: number;
  height: number;
}

const HUD_HEIGHT_FRACTION = 0.19;
const BOARD_PADDING_FRACTION = 0.035;

export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
): CanvasViewport {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  const displayWidth = Math.max(1, Math.floor(width * dpr));
  const displayHeight = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height };
}

export function createHoles(
  width: number,
  height: number,
  rows: number,
  cols: number
): Hole[] {
  const hudHeight = Math.max(90, Math.floor(height * HUD_HEIGHT_FRACTION));
  const boardPadding = Math.max(16, Math.floor(Math.min(width, height) * BOARD_PADDING_FRACTION));
  const boardLeft = boardPadding;
  const boardRight = width - boardPadding;
  const boardTop = hudHeight + boardPadding * 0.5;
  const boardBottom = height - boardPadding;
  const boardWidth = boardRight - boardLeft;
  const boardHeight = boardBottom - boardTop;
  const cellWidth = boardWidth / cols;
  const cellHeight = boardHeight / rows;
  const radius = Math.min(cellWidth, cellHeight) * 0.33;

  const holes: Hole[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      holes.push({
        id: row * cols + col,
        center: {
          x: boardLeft + cellWidth * (col + 0.5),
          y: boardTop + cellHeight * (row + 0.56)
        },
        radius
      });
    }
  }
  return holes;
}

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f5df9c");
  gradient.addColorStop(1, "#b7d986");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  context.beginPath();
  context.arc(width * 0.16, height * 0.2, width * 0.2, 0, Math.PI * 2);
  context.arc(width * 0.83, height * 0.12, width * 0.13, 0, Math.PI * 2);
  context.fill();
}

function drawHud(
  context: CanvasRenderingContext2D,
  width: number,
  state: GameState
): void {
  const panelHeight = 82;
  context.fillStyle = "rgba(38, 46, 31, 0.2)";
  context.fillRect(0, 0, width, panelHeight);

  const remainingSeconds = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
  context.fillStyle = "#162318";
  context.font = "700 23px 'Trebuchet MS', 'Gill Sans', sans-serif";
  context.textBaseline = "middle";
  context.fillText(`Score ${state.score}`, 18, panelHeight / 2);
  context.fillText(`Time ${remainingSeconds}s`, width / 2 - 56, panelHeight / 2);
  context.fillText(`Best ${state.bestScore}`, width - 150, panelHeight / 2);
}

function drawHole(context: CanvasRenderingContext2D, hole: Hole): void {
  context.fillStyle = "#5d3417";
  context.beginPath();
  context.ellipse(
    hole.center.x,
    hole.center.y + hole.radius * 0.2,
    hole.radius * 1.05,
    hole.radius * 0.52,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.strokeStyle = "rgba(33, 16, 6, 0.45)";
  context.lineWidth = 4;
  context.stroke();
}

function drawMole(
  context: CanvasRenderingContext2D,
  hole: Hole
): void {
  const bodyRadius = hole.radius * 0.72;
  const centerY = hole.center.y - hole.radius * 0.36;

  context.fillStyle = "#8a5834";
  context.beginPath();
  context.arc(hole.center.x, centerY, bodyRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f7d6bd";
  context.beginPath();
  context.arc(hole.center.x - bodyRadius * 0.26, centerY - bodyRadius * 0.14, bodyRadius * 0.12, 0, Math.PI * 2);
  context.arc(hole.center.x + bodyRadius * 0.26, centerY - bodyRadius * 0.14, bodyRadius * 0.12, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#201712";
  context.beginPath();
  context.arc(hole.center.x - bodyRadius * 0.26, centerY - bodyRadius * 0.14, bodyRadius * 0.05, 0, Math.PI * 2);
  context.arc(hole.center.x + bodyRadius * 0.26, centerY - bodyRadius * 0.14, bodyRadius * 0.05, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#201712";
  context.lineWidth = Math.max(2, bodyRadius * 0.06);
  context.beginPath();
  context.arc(hole.center.x, centerY + bodyRadius * 0.16, bodyRadius * 0.22, 0.1, Math.PI - 0.1);
  context.stroke();
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState
): void {
  if (state.status === "running") {
    return;
  }

  context.fillStyle = "rgba(17, 21, 15, 0.38)";
  context.fillRect(0, 0, width, height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff8dd";

  if (state.status === "idle") {
    context.font = "700 38px Impact, Haettenschweiler, sans-serif";
    context.fillText("Whack-a-Mole", width / 2, height / 2 - 14);
    context.font = "700 22px 'Trebuchet MS', 'Gill Sans', sans-serif";
    context.fillText("Press Start", width / 2, height / 2 + 24);
  } else {
    context.font = "700 36px Impact, Haettenschweiler, sans-serif";
    context.fillText("Time's Up!", width / 2, height / 2 - 26);
    context.font = "700 21px 'Trebuchet MS', 'Gill Sans', sans-serif";
    context.fillText(`Final Score: ${state.score}`, width / 2, height / 2 + 8);
    context.fillText("Press Restart to play again", width / 2, height / 2 + 40);
  }

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

export function renderGame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GameState,
  holes: Hole[]
): void {
  drawBackground(context, width, height);
  drawHud(context, width, state);

  const activeHoles = new Set(state.activeMoles.map((mole) => mole.holeId));
  for (const hole of holes) {
    drawHole(context, hole);
    if (activeHoles.has(hole.id)) {
      drawMole(context, hole);
    }
  }

  drawOverlay(context, width, height, state);
}

