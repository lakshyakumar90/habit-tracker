import { Audio } from "expo-av";

const SOUND_URLS = {
  sparkle: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
  chime: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
  pop: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
};

export type CelebrationSoundKey = keyof typeof SOUND_URLS;

let activeSound: Audio.Sound | null = null;

export async function playAppSound(
  type: CelebrationSoundKey,
  volume: number,
): Promise<void> {
  try {
    if (activeSound) {
      await activeSound.unloadAsync();
      activeSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUND_URLS[type] },
      {
        shouldPlay: true,
        volume,
      },
    );

    activeSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        if (activeSound === sound) {
          activeSound = null;
        }
      }
    });
  } catch {
    // Keep UI flow smooth even when audio cannot be loaded.
  }
}
