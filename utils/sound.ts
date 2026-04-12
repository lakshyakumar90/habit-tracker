import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

// ─── Sound Options ────────────────────────────────────────────────────────────

export const CELEBRATION_SOUND_OPTIONS = [
  { key: "sparkle", label: "Sparkle" },
  { key: "chime", label: "Bright Chime" },
  { key: "pop", label: "Punchy Pop" },
] as const;

export const TICK_SOUND_OPTIONS = [
  { key: "tick", label: "Classic Tick" },
  { key: "click", label: "Soft Click" },
  { key: "wood", label: "Wood Tap" },
] as const;

export type CelebrationSoundKey =
  (typeof CELEBRATION_SOUND_OPTIONS)[number]["key"];
export type TickSoundKey = (typeof TICK_SOUND_OPTIONS)[number]["key"];
export type AppSoundKey = CelebrationSoundKey | TickSoundKey;

// ─── Local bundled assets instead of network URLs ─────────────────────────────
// Place files in assets/sounds/ and import them:

const SOUND_LIBRARY: Record<AppSoundKey, number> = {
  sparkle: require("@/assets/sounds/sparkle.mp3"),
  chime: require("@/assets/sounds/chime.mp3"),
  pop: require("@/assets/sounds/pop.mp3"),
  tick: require("@/assets/sounds/tick.mp3"),
  click: require("@/assets/sounds/click.mp3"),
  wood: require("@/assets/sounds/wood.mp3"),
};

// ─── Internal State ───────────────────────────────────────────────────────────

const soundCache = new Map<AppSoundKey, Audio.Sound>();
const loadingPromises = new Map<AppSoundKey, Promise<Audio.Sound>>();
let activeSound: Audio.Sound | null = null;
let activeSoundKey: AppSoundKey | null = null;
let audioModePrepared = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

const ensureAudioMode = async () => {
  if (audioModePrepared) return;

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  });

  audioModePrepared = true;
};

// ─── Core: Load with deduplication ────────────────────────────────────────────

const loadSound = (key: AppSoundKey): Promise<Audio.Sound> => {
  // Return cached instance immediately
  const cached = soundCache.get(key);
  if (cached) return Promise.resolve(cached);

  // Deduplicate concurrent loads for the same key
  const existing = loadingPromises.get(key);
  if (existing) return existing;

  const promise = (async () => {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(SOUND_LIBRARY[key], {
      shouldPlay: false,
      volume: 1,
    });
    soundCache.set(key, sound);
    loadingPromises.delete(key);
    return sound;
  })();

  loadingPromises.set(key, promise);
  return promise;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Preload all sounds in the background.
 * Uses InteractionManager-friendly sequential loading
 * to avoid blocking the JS thread with parallel network/IO.
 */
export const preloadAppSounds = async (): Promise<void> => {
  const allKeys: AppSoundKey[] = [
    ...CELEBRATION_SOUND_OPTIONS.map((o) => o.key),
    ...TICK_SOUND_OPTIONS.map((o) => o.key),
  ];

  // Deduplicate keys (some map to the same file)
  const uniqueKeys = [...new Set(allKeys)];

  for (const key of uniqueKeys) {
    try {
      await loadSound(key);
    } catch {
      // Silently skip — sound will load on first use
    }
  }
};

export const stopSoundPreview = async (): Promise<void> => {
  if (!activeSound) return;

  const sound = activeSound;
  activeSound = null;
  activeSoundKey = null;

  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.stopAsync();
    }
    if (status.isLoaded) {
      await sound.setPositionAsync(0);
    }
  } catch {
    // Sound may have been unloaded — safe to ignore
  }
};

export const playSoundPreview = async (
  key: AppSoundKey,
  volume: number,
): Promise<void> => {
  try {
    // If same sound is already playing, just restart it
    if (activeSoundKey === key && activeSound) {
      const status = await activeSound.getStatusAsync();
      if (status.isLoaded) {
        await activeSound.setVolumeAsync(clampVolume(volume));
        await activeSound.setPositionAsync(0);
        await activeSound.playAsync();
        return;
      }
    }

    // Stop previous sound if different
    if (activeSound) {
      await stopSoundPreview();
    }

    const sound = await loadSound(key);

    // Check status before operating — prevents "sound is not loaded" crashes
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    activeSound = sound;
    activeSoundKey = key;

    await sound.setVolumeAsync(clampVolume(volume));
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Keep UI smooth
    activeSound = null;
    activeSoundKey = null;
  }
};

// Cleanup sounds on fast refresh to avoid Android ExoPlayer thread crash
if (__DEV__) {
  if ((module as any).hot) {
    (module as any).hot.dispose(async () => {
      for (const sound of soundCache.values()) {
        try {
          await sound.unloadAsync();
        } catch {}
      }
      soundCache.clear();
      loadingPromises.clear();
      activeSound = null;
      activeSoundKey = null;
    });
  }
}

export const playAppSound = playSoundPreview;

export const playTickSound = (
  key: TickSoundKey,
  volume: number,
): Promise<void> => playSoundPreview(key, volume);

/**
 * Clean up all cached sounds. Call on app background or unmount.
 */
export const unloadAllSounds = async (): Promise<void> => {
  activeSound = null;
  activeSoundKey = null;

  const entries = [...soundCache.entries()];
  soundCache.clear();
  loadingPromises.clear();

  for (const [, sound] of entries) {
    try {
      await sound.unloadAsync();
    } catch {
      // Ignore
    }
  }
};
