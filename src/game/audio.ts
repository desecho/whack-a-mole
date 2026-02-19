type AudioContextConstructor = new () => AudioContext;

interface HitSoundPlayer {
  prime: () => void;
  playHit: () => void;
  destroy: () => void;
}

const HIT_DURATION_SECONDS = 0.09;
const HIT_ATTACK_SECONDS = 0.006;
const HIT_MIN_GAIN = 0.0001;
const HIT_PEAK_GAIN = 0.2;
const HIT_START_FREQUENCY_HZ = 860;
const HIT_END_FREQUENCY_HZ = 620;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const audioGlobal = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext ?? null;
}

export function createHitSoundPlayer(): HitSoundPlayer {
  let context: AudioContext | null = null;
  let unavailable = false;
  let destroyed = false;

  const ensureContext = (): AudioContext | null => {
    if (destroyed || unavailable) {
      return null;
    }

    if (context && context.state !== "closed") {
      return context;
    }

    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
      unavailable = true;
      return null;
    }

    try {
      context = new AudioContextCtor();
      return context;
    } catch {
      unavailable = true;
      return null;
    }
  };

  const resumeIfNeeded = (audioContext: AudioContext): void => {
    if (audioContext.state !== "suspended") {
      return;
    }
    void audioContext.resume().catch(() => {
      // Ignore autoplay-policy and transient resume failures.
    });
  };

  const prime = (): void => {
    const audioContext = ensureContext();
    if (!audioContext) {
      return;
    }
    resumeIfNeeded(audioContext);
  };

  const playHit = (): void => {
    const audioContext = ensureContext();
    if (!audioContext) {
      return;
    }
    resumeIfNeeded(audioContext);

    const startAt = audioContext.currentTime;
    const stopAt = startAt + HIT_DURATION_SECONDS;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(HIT_START_FREQUENCY_HZ, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(HIT_END_FREQUENCY_HZ, stopAt);

    gainNode.gain.setValueAtTime(HIT_MIN_GAIN, startAt);
    gainNode.gain.exponentialRampToValueAtTime(
      HIT_PEAK_GAIN,
      startAt + HIT_ATTACK_SECONDS
    );
    gainNode.gain.exponentialRampToValueAtTime(HIT_MIN_GAIN, stopAt);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };

    oscillator.start(startAt);
    oscillator.stop(stopAt);
  };

  const destroy = (): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;

    if (!context) {
      return;
    }

    const activeContext = context;
    context = null;
    void activeContext.close().catch(() => {
      // Ignore teardown errors.
    });
  };

  return {
    prime,
    playHit,
    destroy
  };
}
