// Tiny WebAudio beeps, only when sound is enabled. No audio assets needed.
let ctx: AudioContext | null = null;
export function playBeep(enabled: boolean, freq = 660, ms = 80): void {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = freq; gain.gain.value = 0.05;
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); setTimeout(() => osc.stop(), ms);
  } catch { /* audio unavailable: ignore */ }
}
