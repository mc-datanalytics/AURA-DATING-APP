


// Simple procedural audio synthesizer for "Glassy/Ethereal" UI sounds
// No external assets required.

let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

const initAudio = () => {
  if (isMuted) return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Plays a soft, glassy "pop" or "click"
 * Used for: Buttons, selection
 */
export const playClick = (pitch: number = 800) => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(pitch + 100, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

/**
 * Plays a crisp paper flip / card flip sound
 */
export const playCardFlip = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // White noise burst filtered
    const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(t);
}

/**
 * Plays a smooth ascending chime (Positive action)
 * Used for: Swipe Right (Like)
 */
export const playSwipeRight = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  
  // Fundamental
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t); // A4
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.2); // Slide up to A5

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(t);
  osc.stop(t + 0.4);

  // Harmonics for "sparkle"
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(880, t);
  osc2.frequency.linearRampToValueAtTime(1760, t + 0.2);
  
  gain2.gain.setValueAtTime(0, t);
  gain2.gain.linearRampToValueAtTime(0.05, t + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t);
  osc2.stop(t + 0.3);
};

/**
 * Plays a soft descending tone (Neutral/Negative action)
 * Used for: Swipe Left (Pass)
 */
export const playSwipeLeft = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.25);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + 0.3);
};

/**
 * Plays a energetic magical sound
 * Used for: Super Like
 */
export const playSuperLike = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  
  // Quick ascending arpeggio
  const notes = [523.25, 783.99, 1046.50, 1318.51, 1567.98];
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + (i * 0.05);
    
    osc.type = 'triangle'; // Brighter sound
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3); 
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(start);
    osc.stop(start + 0.3);
  });
};

/**
 * Plays a magical chord arpeggio
 * Used for: Match Success
 */
export const playMatchSuccess = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  
  // Major Chord Arpeggio (C, E, G, C)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + (i * 0.08);
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5); // Long tail/reverb feel
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(start);
    osc.stop(start + 1.5);
  });
};

/**
 * Plays a subtle "whoosh" transition
 */
export const playTransition = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Filtered noise simulation using an oscillator for simplicity
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.3);
};

// --- DAILY AURA SOUNDS ---

export const playDailyAuraOpen = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  
  // Deep ethereal swell
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.linearRampToValueAtTime(440, t + 1);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 2.0);
}

export const playDailyAuraComplete = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    // High sparkle
    const notes = [880, 1108, 1318, 1760];
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + (i * 0.1);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 3.0); // Very long tail

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 3.0);
    });
}

// --- PREMIUM SOUND ---

export const playPremiumOpen = () => {
  const ctx = initAudio();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Luxurious low chord
  const notes = [261.63, 329.63, 392.00, 493.88]; // C Major 7
  
  notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Sawtooth for richness
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      // Filter for "muffled gold" effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.linearRampToValueAtTime(1000, t + 0.5);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t);
      osc.stop(t + 2.0);
  });
}
