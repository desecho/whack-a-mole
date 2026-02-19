import { getMoleCenter } from "./moleMotion";
import type { ActiveMole, GameState, Hole } from "./types";

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
  hole: Hole,
  mole: ActiveMole,
  nowMs: number
): void {
  const headRadius = hole.radius * 0.78;
  const center = getMoleCenter(hole, mole, nowMs);
  const centerX = center.x;
  const centerY = center.y;
  const lineWidth = Math.max(1.5, hole.radius * 0.055);

  context.save();

  // Clip so the mole appears to emerge from the tunnel.
  const clipTop = hole.center.y - hole.radius * 2.2;
  const clipBottom = hole.center.y + hole.radius * 0.3;
  context.beginPath();
  context.rect(
    centerX - hole.radius * 1.6,
    clipTop,
    hole.radius * 3.2,
    clipBottom - clipTop
  );
  context.clip();

  const furGradient = context.createRadialGradient(
    centerX - headRadius * 0.28,
    centerY - headRadius * 0.4,
    headRadius * 0.2,
    centerX,
    centerY + headRadius * 0.25,
    headRadius * 1.08
  );
  furGradient.addColorStop(0, "#af7b4f");
  furGradient.addColorStop(0.55, "#825131");
  furGradient.addColorStop(1, "#5b341f");

  for (const side of [-1, 1] as const) {
    const earX = centerX + side * headRadius * 0.47;
    const earY = centerY - headRadius * 0.52;

    context.fillStyle = "#6c3f26";
    context.beginPath();
    context.ellipse(
      earX,
      earY,
      headRadius * 0.25,
      headRadius * 0.22,
      side * 0.28,
      0,
      Math.PI * 2
    );
    context.fill();

    context.fillStyle = "#d9a692";
    context.beginPath();
    context.ellipse(
      earX + side * headRadius * 0.03,
      earY + headRadius * 0.01,
      headRadius * 0.13,
      headRadius * 0.11,
      side * 0.24,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.fillStyle = furGradient;
  context.beginPath();
  context.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(182, 125, 84, 0.3)";
  context.beginPath();
  context.ellipse(
    centerX,
    centerY + headRadius * 0.2,
    headRadius * 0.72,
    headRadius * 0.5,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = "#e8c7ad";
  context.beginPath();
  context.ellipse(
    centerX,
    centerY + headRadius * 0.25,
    headRadius * 0.48,
    headRadius * 0.35,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = "rgba(98, 63, 42, 0.2)";
  context.beginPath();
  context.ellipse(
    centerX,
    centerY + headRadius * 0.31,
    headRadius * 0.39,
    headRadius * 0.18,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = "#523028";
  context.beginPath();
  context.ellipse(
    centerX,
    centerY + headRadius * 0.13,
    headRadius * 0.18,
    headRadius * 0.12,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.strokeStyle = "#2f1712";
  context.lineWidth = Math.max(1.1, lineWidth * 0.78);
  for (const side of [-1, 1] as const) {
    context.beginPath();
    context.moveTo(centerX + side * headRadius * 0.06, centerY + headRadius * 0.12);
    context.lineTo(centerX + side * headRadius * 0.06, centerY + headRadius * 0.19);
    context.stroke();
  }

  for (const side of [-1, 1] as const) {
    const eyeX = centerX + side * headRadius * 0.3;
    const eyeY = centerY - headRadius * 0.08;

    context.fillStyle = "#1d100b";
    context.beginPath();
    context.arc(eyeX, eyeY, headRadius * 0.085, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(255, 250, 243, 0.9)";
    context.beginPath();
    context.arc(
      eyeX - side * headRadius * 0.018,
      eyeY - headRadius * 0.024,
      headRadius * 0.024,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.strokeStyle = "rgba(39, 23, 14, 0.62)";
  context.lineWidth = Math.max(1, lineWidth * 0.62);
  for (const side of [-1, 1] as const) {
    const originX = centerX + side * headRadius * 0.3;
    const originY = centerY + headRadius * 0.24;
    for (const offset of [-0.08, 0, 0.08]) {
      context.beginPath();
      context.moveTo(originX, originY + headRadius * offset);
      context.lineTo(
        originX + side * headRadius * 0.56,
        originY + headRadius * offset - headRadius * 0.06
      );
      context.stroke();
    }
  }

  context.fillStyle = "#fff2df";
  const toothWidth = headRadius * 0.1;
  const toothHeight = headRadius * 0.22;
  const toothTop = centerY + headRadius * 0.35;
  context.fillRect(centerX - toothWidth - headRadius * 0.02, toothTop, toothWidth, toothHeight);
  context.fillRect(centerX + headRadius * 0.02, toothTop, toothWidth, toothHeight);

  context.strokeStyle = "#3a2017";
  context.lineWidth = Math.max(1, lineWidth * 0.8);
  context.beginPath();
  context.arc(
    centerX,
    centerY + headRadius * 0.39,
    headRadius * 0.22,
    0.2,
    Math.PI - 0.2
  );
  context.stroke();

  for (const side of [-1, 1] as const) {
    const pawX = centerX + side * headRadius * 0.5;
    const pawY = centerY + headRadius * 0.5;
    context.fillStyle = "#7b4a2e";
    context.beginPath();
    context.ellipse(
      pawX,
      pawY,
      headRadius * 0.22,
      headRadius * 0.14,
      0,
      0,
      Math.PI * 2
    );
    context.fill();

    context.strokeStyle = "#d8bea6";
    context.lineWidth = Math.max(1, lineWidth * 0.52);
    for (const clawOffset of [-0.07, 0, 0.07]) {
      context.beginPath();
      context.moveTo(pawX + headRadius * clawOffset, pawY + headRadius * 0.03);
      context.lineTo(pawX + headRadius * clawOffset, pawY + headRadius * 0.11);
      context.stroke();
    }
  }

  context.restore();
}

function drawHoleFrontRim(context: CanvasRenderingContext2D, hole: Hole): void {
  const rimY = hole.center.y + hole.radius * 0.22;
  const rimRadiusX = hole.radius * 1.08;
  const rimRadiusY = hole.radius * 0.55;

  const rimGradient = context.createLinearGradient(0, rimY - rimRadiusY, 0, rimY + rimRadiusY);
  rimGradient.addColorStop(0, "rgba(183, 129, 80, 0.12)");
  rimGradient.addColorStop(0.46, "rgba(110, 66, 36, 0.34)");
  rimGradient.addColorStop(1, "rgba(59, 32, 16, 0.56)");

  context.fillStyle = rimGradient;
  context.beginPath();
  context.ellipse(
    hole.center.x,
    rimY,
    rimRadiusX,
    rimRadiusY,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  context.strokeStyle = "rgba(31, 16, 8, 0.62)";
  context.lineWidth = Math.max(2, hole.radius * 0.08);
  context.beginPath();
  context.ellipse(
    hole.center.x,
    rimY + hole.radius * 0.02,
    rimRadiusX * 0.97,
    rimRadiusY * 0.89,
    0,
    0,
    Math.PI * 2
  );
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
  holes: Hole[],
  nowMs: number
): void {
  drawBackground(context, width, height);
  drawHud(context, width, state);

  const activeMolesByHole = new Map(
    state.activeMoles.map((mole) => [mole.holeId, mole] as const)
  );
  for (const hole of holes) {
    drawHole(context, hole);
  }
  for (const hole of holes) {
    const activeMole = activeMolesByHole.get(hole.id);
    if (activeMole) {
      drawMole(context, hole, activeMole, nowMs);
    }
  }
  for (const hole of holes) {
    drawHoleFrontRim(context, hole);
  }

  drawOverlay(context, width, height, state);
}
