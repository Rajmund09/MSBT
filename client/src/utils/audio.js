export const playCinematicImpact = () => {
  if (typeof window === "undefined") return;
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // 1. First Sub Bass Thud ("Ta")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(60, t);
    osc1.frequency.exponentialRampToValueAtTime(20, t + 0.5);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.8, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.5);

    // 2. Second Sub Bass Thud ("Dum")
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(55, t + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(15, t + 1.5);
    gain2.gain.setValueAtTime(0, t + 0.15);
    gain2.gain.linearRampToValueAtTime(1, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.15);
    osc2.stop(t + 1.5);

    // 3. Noise splash for cinematic texture
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter noise to sound like a low rumble/splash
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(20, t + 1.5);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t + 0.15);
    noiseGain.gain.linearRampToValueAtTime(0.3, t + 0.18);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t + 0.15);

    // 4. Big Synth Pad (The ringing out)
    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = "sawtooth";
    pad.frequency.setValueAtTime(55, t + 0.15);
    pad.frequency.linearRampToValueAtTime(54, t + 3); // slight detune drop
    
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(1000, t + 0.15);
    padFilter.frequency.exponentialRampToValueAtTime(100, t + 3);

    padGain.gain.setValueAtTime(0, t + 0.15);
    padGain.gain.linearRampToValueAtTime(0.15, t + 0.2);
    padGain.gain.exponentialRampToValueAtTime(0.001, t + 3);

    pad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(ctx.destination);
    pad.start(t + 0.15);
    pad.stop(t + 3);

  } catch (err) {
    console.error("Audio playback failed", err);
  }
};
