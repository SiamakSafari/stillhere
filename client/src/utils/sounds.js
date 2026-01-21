// Sound manager for check-in and milestone sounds
// Uses Web Audio API for low latency playback

let audioContext = null;

// Initialize audio context on user interaction
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Preloaded sound buffers
const soundBuffers = {};

// Load a sound file into a buffer
const loadSound = async (name, url) => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    soundBuffers[name] = await ctx.decodeAudioData(arrayBuffer);
    return true;
  } catch (error) {
    console.warn(`Could not load sound: ${name}`, error);
    return false;
  }
};

// Play a preloaded sound
const playBuffer = (name, volume = 0.5) => {
  const buffer = soundBuffers[name];
  if (!buffer) return;

  try {
    const ctx = getAudioContext();

    // Resume context if suspended (required for Chrome autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch (error) {
    console.warn(`Could not play sound: ${name}`, error);
  }
};

// Fallback: Play sound using HTML Audio element
const playAudioElement = (url, volume = 0.5) => {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {
      // Ignore play errors (autoplay policy)
    });
  } catch (error) {
    console.warn('Could not play audio element', error);
  }
};

// Sound effect functions
export const sounds = {
  // Initialize sound system and preload sounds
  init: async () => {
    try {
      await Promise.all([
        loadSound('checkin', '/sounds/checkin.mp3'),
        loadSound('milestone', '/sounds/milestone.mp3')
      ]);
    } catch (error) {
      console.warn('Could not initialize sounds', error);
    }
  },

  // Play check-in success sound
  playCheckIn: (enabled = true) => {
    if (!enabled) return;

    if (soundBuffers.checkin) {
      playBuffer('checkin', 0.4);
    } else {
      playAudioElement('/sounds/checkin.mp3', 0.4);
    }
  },

  // Play milestone achievement sound
  playMilestone: (enabled = true) => {
    if (!enabled) return;

    if (soundBuffers.milestone) {
      playBuffer('milestone', 0.5);
    } else {
      playAudioElement('/sounds/milestone.mp3', 0.5);
    }
  }
};

export default sounds;
