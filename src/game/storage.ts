const BEST_SCORE_KEY = "whackamole.bestScore";

function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage) {
    return storage;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getBestScore(storage?: Storage | null): number {
  const resolved = resolveStorage(storage);
  if (!resolved) {
    return 0;
  }
  const raw = resolved.getItem(BEST_SCORE_KEY);
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function setBestScore(score: number, storage?: Storage | null): void {
  const resolved = resolveStorage(storage);
  if (!resolved) {
    return;
  }
  const safeScore = Math.max(0, Math.floor(score));
  resolved.setItem(BEST_SCORE_KEY, String(safeScore));
}

