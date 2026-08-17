export interface CarouselConfig {
  /** Reference card width in px at desktop sizes (actual rendered width is responsive; the
   *  engine re-measures it from the DOM, this is only the CSS clamp() ceiling). */
  cardWidthMax: number;
  /** Card aspect ratio, height / width. */
  cardAspect: number;
  /** Space between cards at center, px. Negative values overlap the cards. Editable. */
  gap: number;
  /** How much `gap` itself shrinks per card-step away from center (0..1 fraction, unclamped
   *  — past 1/gapFalloffPerStep steps the gap goes negative and cards start to overlap). */
  gapFalloffPerStep: number;
  /** CSS perspective distance, px. Smaller = more dramatic 3D foreshortening. */
  perspective: number;
  /** Simulated camera vertical angle, deg. Tilts the whole row, as if the camera moved up/down. */
  cameraTilt: number;
  /** Per-card rotateY curvature per card-step away from center, deg. 0 = flat row. */
  cardCurve: number;
  /** How much a card shrinks per card-step away from center (0..1 fraction). */
  depthScalePerStep: number;
  /** Floor for the depth scale, so distant cards don't vanish. */
  minScale: number;
  /** How much of the page background gets tinted over a card per card-step away from center
   *  (0..1 fraction, e.g. 0.1 = +10%/step) — darkens/fades it toward the backdrop without
   *  making the card itself translucent (which would show overlapping cards through it). */
  depthTintPerStep: number;
  /** Ceiling for the depth tint, so distant cards don't fully vanish into the background. */
  maxDepthTint: number;
  /** Exponential momentum decay rate after a drag release (larger = stops sooner). */
  momentumFriction: number;
  /** Time constant for easing into a snapped/clamped position, ms. */
  snapTauMs: number;
  /** Momentum speed (px/ms) below which momentum is considered settled and comes to rest. */
  snapVelocityThreshold: number;
  /** How much a drag is dampened once it's pulled past the first/last card (0..1). */
  rubberBandFactor: number;
}

export const DEFAULT_CONFIG: CarouselConfig = {
  cardWidthMax: 300,
  cardAspect: 500 / 300,
  gap: 55,
  gapFalloffPerStep: 0.6667,
  perspective: 1600,
  cameraTilt: 0,
  cardCurve: 0,
  depthScalePerStep: 0.09,
  minScale: 0.35,
  depthTintPerStep: 0.2,
  maxDepthTint: 0.85,
  momentumFriction: 0.003,
  snapTauMs: 220,
  snapVelocityThreshold: 0.02,
  rubberBandFactor: 0.35,
};
