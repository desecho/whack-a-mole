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
  hitRadiusScale = 0.72
): string | null {
  const holeMap = new Map(holes.map((hole) => [hole.id, hole]));

  for (let index = activeMoles.length - 1; index >= 0; index -= 1) {
    const mole = activeMoles[index];
    const hole = holeMap.get(mole.holeId);
    if (!hole) {
      continue;
    }
    const hitRadius = hole.radius * hitRadiusScale;
    const deltaX = point.x - hole.center.x;
    const deltaY = point.y - hole.center.y;
    if (deltaX * deltaX + deltaY * deltaY <= hitRadius * hitRadius) {
      return mole.id;
    }
  }
  return null;
}

