// Two-note chime made with WebAudio: no audio file, no network.
export function chime(ctx: AudioContext) {
  const now = ctx.currentTime;
  [880, 1318.5].forEach((freq, i) => {
    const t = now + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.85);
  });
}
