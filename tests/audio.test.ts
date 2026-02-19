import { afterEach, describe, expect, it, vi } from "vitest";
import { createHitSoundPlayer } from "../src/game/audio";

type MockOscillator = {
  type: OscillatorType;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
};

type MockGainNode = {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

class MockAudioContext {
  public static instances: MockAudioContext[] = [];

  public state: AudioContextState = "suspended";
  public currentTime = 3;
  public destination = {} as AudioDestinationNode;
  public readonly oscillators: MockOscillator[] = [];
  public readonly gains: MockGainNode[] = [];

  public readonly resume = vi.fn(async () => {
    this.state = "running";
  });

  public readonly close = vi.fn(async () => {
    this.state = "closed";
  });

  public readonly createOscillator = vi.fn(() => {
    const oscillator: MockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    };

    oscillator.stop.mockImplementation(() => {
      if (oscillator.onended) {
        oscillator.onended();
      }
    });

    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  });

  public readonly createGain = vi.fn(() => {
    const gainNode: MockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    this.gains.push(gainNode);
    return gainNode as unknown as GainNode;
  });

  public constructor() {
    MockAudioContext.instances.push(this);
  }

  public static reset(): void {
    MockAudioContext.instances = [];
  }
}

const audioGlobal = globalThis as unknown as {
  AudioContext?: unknown;
  webkitAudioContext?: unknown;
};

const originalAudioContext = audioGlobal.AudioContext;
const originalWebkitAudioContext = audioGlobal.webkitAudioContext;

function restoreAudioConstructors(): void {
  audioGlobal.AudioContext = originalAudioContext;
  audioGlobal.webkitAudioContext = originalWebkitAudioContext;
}

afterEach(() => {
  restoreAudioConstructors();
  MockAudioContext.reset();
  vi.restoreAllMocks();
});

describe("createHitSoundPlayer", () => {
  it("is safe when no audio context constructor exists", () => {
    audioGlobal.AudioContext = undefined;
    audioGlobal.webkitAudioContext = undefined;
    const player = createHitSoundPlayer();

    expect(() => player.playHit()).not.toThrow();
    expect(() => player.prime()).not.toThrow();
    expect(() => player.destroy()).not.toThrow();
  });

  it("is safe when context initialization fails", () => {
    class FailingAudioContext {
      public constructor() {
        throw new Error("init failed");
      }
    }

    audioGlobal.AudioContext = FailingAudioContext;
    const player = createHitSoundPlayer();

    expect(() => player.playHit()).not.toThrow();
    expect(() => player.prime()).not.toThrow();
  });

  it("primes by resuming a suspended context", () => {
    audioGlobal.AudioContext = MockAudioContext;
    const player = createHitSoundPlayer();

    player.prime();

    expect(MockAudioContext.instances).toHaveLength(1);
    const context = MockAudioContext.instances[0];
    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it("creates and tears down one-shot audio nodes on hit", () => {
    audioGlobal.AudioContext = MockAudioContext;
    const player = createHitSoundPlayer();

    player.playHit();

    expect(MockAudioContext.instances).toHaveLength(1);
    const context = MockAudioContext.instances[0];
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(context.createGain).toHaveBeenCalledTimes(1);

    const oscillator = context.oscillators[0];
    const gainNode = context.gains[0];

    expect(oscillator.start).toHaveBeenCalledTimes(1);
    expect(oscillator.stop).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledTimes(1);
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledTimes(2);
    expect(oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(gainNode.disconnect).toHaveBeenCalledTimes(1);
  });

  it("re-triggers a new one-shot for each rapid hit", () => {
    audioGlobal.AudioContext = MockAudioContext;
    const player = createHitSoundPlayer();

    player.playHit();
    player.playHit();
    player.playHit();

    const context = MockAudioContext.instances[0];
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
    expect(context.createGain).toHaveBeenCalledTimes(3);
    expect(new Set(context.oscillators).size).toBe(3);
  });

  it("closes context once and no-ops after destroy", () => {
    audioGlobal.AudioContext = MockAudioContext;
    const player = createHitSoundPlayer();

    player.prime();
    expect(MockAudioContext.instances).toHaveLength(1);
    const context = MockAudioContext.instances[0];

    player.destroy();
    player.destroy();
    player.playHit();

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).not.toHaveBeenCalled();
  });
});
