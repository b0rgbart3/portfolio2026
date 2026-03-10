type AudioContextConstructor = typeof AudioContext;

const getAudioContext = (): AudioContext | null => {
  try {
    const Ctx: AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContextConstructor })
        .webkitAudioContext;
    return new Ctx();
  } catch {
    return null;
  }
};

const _playPanelOpenV1 = (ctx: AudioContext) => {
  const t = ctx.currentTime;

  // Deep power thump — system activation jolt
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(110, t);
  thump.frequency.exponentialRampToValueAtTime(38, t + 0.18);
  thumpGain.gain.setValueAtTime(0, t);
  thumpGain.gain.linearRampToValueAtTime(0.6, t + 0.008);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  thump.connect(thumpGain);
  thumpGain.connect(ctx.destination);
  thump.start(t);
  thump.stop(t + 0.5);

  // Low drone — reactor coming online, slow attack (A2 = 110Hz)
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(110, t + 0.05);
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 280;
  droneFilter.Q.value = 1.5;
  droneGain.gain.setValueAtTime(0, t + 0.05);
  droneGain.gain.linearRampToValueAtTime(0.09, t + 0.4);
  droneGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(ctx.destination);
  drone.start(t + 0.05);
  drone.stop(t + 1.35);

  // Power sweep — deliberate climb from A2 to E3 (perfect 5th, strong/neutral)
  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(220, t + 0.25);
  sweep.frequency.exponentialRampToValueAtTime(330, t + 1.0);
  sweepGain.gain.setValueAtTime(0, t + 0.25);
  sweepGain.gain.linearRampToValueAtTime(0.1, t + 0.55);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
  sweep.connect(sweepGain);
  sweepGain.connect(ctx.destination);
  sweep.start(t + 0.25);
  sweep.stop(t + 1.3);

  // Tactical confirmation ping — sharp, precise, military
  const ping = ctx.createOscillator();
  const pingGain = ctx.createGain();
  ping.type = "sine";
  ping.frequency.setValueAtTime(440, t + 1.05);
  pingGain.gain.setValueAtTime(0, t + 1.05);
  pingGain.gain.linearRampToValueAtTime(0.14, t + 1.06);
  pingGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  ping.connect(pingGain);
  pingGain.connect(ctx.destination);
  ping.start(t + 1.05);
  ping.stop(t + 1.35);
};

export const playPanelOpen = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  ctx.resume().then(() => _playPanelOpenV1(ctx));
};

// V2 — shorter (~0.6s) and quieter, for experimentation
const _playPanelOpenV2 = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const vol = 0.5; // global volume scalar

  // Deep power thump
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(110, t);
  thump.frequency.exponentialRampToValueAtTime(38, t + 0.1);
  thumpGain.gain.setValueAtTime(0, t);
  thumpGain.gain.linearRampToValueAtTime(0.6 * vol, t + 0.008);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  thump.connect(thumpGain);
  thumpGain.connect(ctx.destination);
  thump.start(t);
  thump.stop(t + 0.25);

  // Power sweep — compressed into ~0.35s
  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(220, t + 0.1);
  sweep.frequency.exponentialRampToValueAtTime(330, t + 0.45);
  sweepGain.gain.setValueAtTime(0, t + 0.1);
  sweepGain.gain.linearRampToValueAtTime(0.1 * vol, t + 0.22);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  sweep.connect(sweepGain);
  sweepGain.connect(ctx.destination);
  sweep.start(t + 0.1);
  sweep.stop(t + 0.6);

  // Confirmation ping — moved earlier
  const ping = ctx.createOscillator();
  const pingGain = ctx.createGain();
  ping.type = "sine";
  ping.frequency.setValueAtTime(440, t + 0.45);
  pingGain.gain.setValueAtTime(0, t + 0.45);
  pingGain.gain.linearRampToValueAtTime(0.14 * vol, t + 0.46);
  pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  ping.connect(pingGain);
  pingGain.connect(ctx.destination);
  ping.start(t + 0.45);
  ping.stop(t + 0.62);
};

export const playPanelOpenV2 = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  ctx.resume().then(() => _playPanelOpenV2(ctx));
};

// Nav click — thump character from V1, short and clean
const _playNavClick = (ctx: AudioContext) => {
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
};

export const playNavClick = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  ctx.resume().then(() => _playNavClick(ctx));
};
