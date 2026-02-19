import { describe, expect, it } from "vitest";
import { getBestScore, setBestScore } from "../src/game/storage";

class MockStorage implements Storage {
  private readonly data = new Map<string, string>();

  public get length(): number {
    return this.data.size;
  }

  public clear(): void {
    this.data.clear();
  }

  public getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key) ?? null : null;
  }

  public key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  public removeItem(key: string): void {
    this.data.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("storage helpers", () => {
  it("returns zero when no storage object is available", () => {
    expect(getBestScore(null)).toBe(0);
  });

  it("returns zero when value is missing or invalid", () => {
    const storage = new MockStorage();
    expect(getBestScore(storage)).toBe(0);

    storage.setItem("whackamole.bestScore", "not-a-number");
    expect(getBestScore(storage)).toBe(0);
  });

  it("persists and reads the best score", () => {
    const storage = new MockStorage();
    setBestScore(17, storage);
    expect(getBestScore(storage)).toBe(17);

    setBestScore(-4, storage);
    expect(getBestScore(storage)).toBe(0);
  });
});

