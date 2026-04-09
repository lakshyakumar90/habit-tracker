import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

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

const SOUND_LIBRARY: Record<AppSoundKey, string> = {
  sparkle:
    "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
  chime: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
  pop: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
  tick: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
  click: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
  wood: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
};

const soundCache = new Map<AppSoundKey, Audio.Sound>();
let activeSound: Audio.Sound | null = null;
let audioModePrepared = false;

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

const loadSound = async (key: AppSoundKey) => {
  const cached = soundCache.get(key);
  if (cached) return cached;

  await ensureAudioMode();
  const { sound } = await Audio.Sound.createAsync(
    { uri: SOUND_LIBRARY[key] },
    { shouldPlay: false, volume: 1, progressUpdateIntervalMillis: 50 },
  );

  soundCache.set(key, sound);
  return sound;
};

export const preloadAppSounds = async () => {
  try {
    await Promise.all(
      [...CELEBRATION_SOUND_OPTIONS, ...TICK_SOUND_OPTIONS].map(({ key }) =>
        loadSound(key),
      ),
    );
  } catch {
    // Ignore preloading failures so the settings screen stays responsive.
  }
};

export const stopSoundPreview = async () => {
  if (!activeSound) return;

  try {
    await activeSound.stopAsync();
    await activeSound.setPositionAsync(0);
  } catch {
    // Ignore stop failures during rapid preview taps.
  } finally {
    activeSound = null;
  }
};

export async function playAppSound(
  type: CelebrationSoundKey,
  volume: number,
): Promise<void> {
  await playSoundPreview(type, volume);
}

export async function playTickSound(
  type: TickSoundKey,
  volume: number,
): Promise<void> {
  await playSoundPreview(type, volume);
}

export async function playSoundPreview(
  type: AppSoundKey,
  volume: number,
): Promise<void> {
  try {
    const sound = await loadSound(type);

    if (activeSound && activeSound !== sound) {
      await stopSoundPreview();
    }

    activeSound = sound;
    try {
      await sound.stopAsync();
    } catch {
      // Ignore if the sound was already idle.
    }
    await sound.setVolumeAsync(clampVolume(volume));
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Keep the UI smooth even when audio cannot be loaded.
  }
}
