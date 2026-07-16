import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;
let ready: Promise<AudioPlayer | null> | null = null;

async function getPlayer(): Promise<AudioPlayer | null> {
  if (player) return player;
  if (ready) return ready;
  ready = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
      });
      player = createAudioPlayer(require('../../assets/sounds/jelly.wav'));
      player.volume = 0.7;
      return player;
    } catch {
      return null;
    } finally {
      ready = null;
    }
  })();
  return ready;
}

export async function playJelly(): Promise<void> {
  try {
    const instance = await getPlayer();
    if (!instance) return;
    await instance.seekTo(0);
    instance.play();
  } catch {
  }
}
