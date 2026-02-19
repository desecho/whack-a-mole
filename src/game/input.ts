import { getMoleCenter } from "./moleMotion";
import type { ActiveMole, Hole, Vec2 } from "./types";

export function eventToCanvasPoint(
  event: PointerEvent,
  canvas: HTMLCanvasElement
): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

export function findHitMoleId(
  point: Vec2,
  activeMoles: ActiveMole[],
  holes: Hole[],
  nowMs: number,
  hitRadiusScale = 0.72
): string | null {
  const holeMap = new Map(holes.map((hole) => [hole.id, hole]));

  for (let index = activeMoles.length - 1; index >= 0; index -= 1) {
    const mole = activeMoles[index];
    const hole = holeMap.get(mole.holeId);
    if (!hole) {
      continue;
    }
    const center = getMoleCenter(hole, mole, nowMs);
    const hitRadius = hole.radius * hitRadiusScale;
    const deltaX = point.x - center.x;
    const deltaY = point.y - center.y;
    if (deltaX * deltaX + deltaY * deltaY <= hitRadius * hitRadius) {
      return mole.id;
    }
  }
  return null;
}
