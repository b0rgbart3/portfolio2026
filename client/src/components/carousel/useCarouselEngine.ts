import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { CarouselConfig } from './config';

type Mode = 'drag' | 'momentum' | 'snap' | 'idle';

/** Pointer movement below this, between down and up, counts as a tap/click rather than a drag. */
const TAP_THRESHOLD_PX = 8;

interface EngineState {
  scrollCenter: number;
  velocity: number; // px/ms
  mode: Mode;
  dragPointerId: number | null;
  dragStartClientX: number;
  dragStartScroll: number;
  /** Index of the card under the pointer at press time, so a tap activates that card
   *  rather than always whichever one happens to be centered. */
  dragStartIndex: number | null;
  lastSampleX: number;
  lastSampleT: number;
  sampleVelocity: number;
  containerWidth: number;
  cardWidth: number;
  lastFrameT: number;
  snapTarget: number | null;
  initialized: boolean;
}

interface EngineOptions {
  /** Fired (only on change) with whichever card is currently nearest the viewport center. */
  onCenterIndexChange?: (index: number) => void;
  /** Fired on pointerdown/up over the row, for a "press" glow affordance. */
  onPressChange?: (pressed: boolean) => void;
  /** Fired with the center card's index when a press+release happens without a real drag. */
  onTap?: (index: number) => void;
}

/**
 * Imperative, requestAnimationFrame-driven positioning engine for the card row.
 * Deliberately bypasses React state for per-frame updates (writes transform/zIndex
 * directly to the card DOM nodes) so animation smoothness isn't gated by render cycles.
 *
 * Interaction is click-and-drag for every pointer type (mouse, touch, pen) — press
 * anywhere in the row and drag to slide it, release for momentum + snap-to-card. A
 * press+release with negligible movement counts as a tap on the center card.
 */
export function useCarouselEngine(
  containerRef: RefObject<HTMLDivElement | null>,
  cardRefs: RefObject<(HTMLDivElement | null)[]>,
  count: number,
  config: CarouselConfig,
  options: EngineOptions,
) {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const onCenterIndexChangeRef = useRef(options.onCenterIndexChange);
  onCenterIndexChangeRef.current = options.onCenterIndexChange;
  const onPressChangeRef = useRef(options.onPressChange);
  onPressChangeRef.current = options.onPressChange;
  const onTapRef = useRef(options.onTap);
  onTapRef.current = options.onTap;

  // With an even card count, resting position sits exactly *between* two cards, so the
  // "nearest" card can be up to half a card-step off true center. That's invisible for the
  // ambient hover glow, but it makes the expand-grow transform originate off-center. Calling
  // this snaps precisely onto a card's true center before it expands.
  const centerOnIndexImplRef = useRef<(index: number) => void>(() => {});
  const centerOnIndex = useCallback((index: number) => centerOnIndexImplRef.current(index), []);

  const stateRef = useRef<EngineState>({
    scrollCenter: 0,
    velocity: 0,
    mode: 'idle',
    dragPointerId: null,
    dragStartClientX: 0,
    dragStartScroll: 0,
    dragStartIndex: null,
    lastSampleX: 0,
    lastSampleT: 0,
    sampleVelocity: 0,
    containerWidth: 0,
    cardWidth: 0,
    lastFrameT: 0,
    snapTarget: null,
    initialized: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = stateRef.current;
    let lastCenterIndex = -1;

    const cardStep = () => state.cardWidth + configRef.current.gap;
    const bounds = () => {
      const step = cardStep();
      const min = state.cardWidth / 2;
      const max = Math.max(min, (count - 1) * step + state.cardWidth / 2);
      return { min, max };
    };

    function measure() {
      // offsetWidth is the untransformed layout size — getBoundingClientRect() would
      // include the live scale/rotateY the engine applies, corrupting this feedback loop.
      state.containerWidth = container!.offsetWidth;
      const firstCard = cardRefs.current?.[0];
      if (firstCard) {
        state.cardWidth = firstCard.offsetWidth;
      }
      if (!state.initialized && state.cardWidth > 0) {
        const { min, max } = bounds();
        state.scrollCenter = (min + max) / 2;
        state.initialized = true;
      }
    }
    measure();

    centerOnIndexImplRef.current = (index: number) => {
      const step = cardStep();
      const clamped = Math.max(0, Math.min(count - 1, index));
      state.scrollCenter = clamped * step + state.cardWidth / 2;
      state.velocity = 0;
      state.mode = 'idle';
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    if (cardRefs.current?.[0]) resizeObserver.observe(cardRefs.current[0]!);

    // ---- Click-and-drag, unified across mouse/touch/pen ----
    function indexFromTarget(target: EventTarget | null): number | null {
      if (!(target instanceof Element)) return null;
      const cardEl = target.closest<HTMLElement>('[data-index]');
      if (!cardEl) return null;
      const idx = Number(cardEl.dataset.index);
      return Number.isNaN(idx) ? null : idx;
    }

    function handlePointerDown(e: PointerEvent) {
      state.mode = 'drag';
      state.dragPointerId = e.pointerId;
      state.dragStartClientX = e.clientX;
      state.dragStartScroll = state.scrollCenter;
      state.dragStartIndex = indexFromTarget(e.target);
      state.lastSampleX = e.clientX;
      state.lastSampleT = performance.now();
      state.sampleVelocity = 0;
      state.snapTarget = null;
      container!.setPointerCapture(e.pointerId);
      onPressChangeRef.current?.(true);
    }
    function handlePointerMove(e: PointerEvent) {
      if (state.mode !== 'drag' || e.pointerId !== state.dragPointerId) return;
      // If the button was released while the pointer was outside the browser window, no
      // pointerup ever fires here — but capture keeps routing moves to us. e.buttons reflects
      // the *current* button state, so a move reporting no buttons held means the drag has
      // already ended; treat it as the release we missed instead of continuing to drag.
      if (e.buttons === 0) {
        handlePointerUp(e);
        return;
      }
      const deltaX = e.clientX - state.dragStartClientX;
      let target = state.dragStartScroll - deltaX;
      const { min, max } = bounds();
      const rubber = configRef.current.rubberBandFactor;
      if (target < min) target = min - (min - target) * rubber;
      if (target > max) target = max + (target - max) * rubber;
      state.scrollCenter = target;

      const now = performance.now();
      const dt = now - state.lastSampleT;
      if (dt > 0) {
        const instVelocity = -(e.clientX - state.lastSampleX) / dt;
        state.sampleVelocity = state.sampleVelocity * 0.7 + instVelocity * 0.3;
      }
      state.lastSampleX = e.clientX;
      state.lastSampleT = now;
    }
    function handlePointerUp(e: PointerEvent) {
      if (e.pointerId !== state.dragPointerId) return;
      state.dragPointerId = null;
      state.velocity = state.sampleVelocity;
      state.mode = 'momentum';
      onPressChangeRef.current?.(false);

      const totalMovement = Math.abs(e.clientX - state.dragStartClientX);
      if (totalMovement < TAP_THRESHOLD_PX) {
        onTapRef.current?.(state.dragStartIndex ?? lastCenterIndex);
      }
    }
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);

    // ---- Animation loop ----
    let rafId = 0;

    // depthScale is purely a function of (index - centerFraction), independent of any
    // other card's position — so it can be precomputed per-index before laying anything out.
    function depthScaleAt(distanceInSteps: number, cfg: CarouselConfig) {
      return Math.max(cfg.minScale, 1 - Math.abs(distanceInSteps) * cfg.depthScalePerStep);
    }

    // Unlike depthScaleAt, deliberately unclamped — the gap itself should keep shrinking
    // past zero the further out a card sits, so distant cards start to overlap rather than
    // just floor out at some fixed minimum spacing.
    function gapScaleAt(distanceInSteps: number, cfg: CarouselConfig) {
      return 1 - Math.abs(distanceInSteps) * cfg.gapFalloffPerStep;
    }

    // Cards are scaled visually (transform: scale()) but a uniform center-to-center step
    // doesn't account for that — shrunk cards eat less of the fixed step, so the *visible*
    // gap between edges grows the smaller cards get. Instead, accumulate real edge-to-edge
    // spacing (half of each scaled card + a gap that itself shrinks/goes negative with
    // distance) outward from the fractional scroll position.
    function computeCenterOffsets(centerFraction: number, cardWidth: number, cfg: CarouselConfig) {
      const offsets = new Array<number>(count).fill(0);
      if (count <= 1) return offsets;

      const cf = Math.max(0, Math.min(count - 1, centerFraction));
      const base = Math.max(0, Math.min(count - 2, Math.floor(cf)));
      const frac = cf - base;

      const segmentLength = (j: number) => {
        const sJ = depthScaleAt(j - cf, cfg);
        const sJ1 = depthScaleAt(j + 1 - cf, cfg);
        const gapScale = (gapScaleAt(j - cf, cfg) + gapScaleAt(j + 1 - cf, cfg)) / 2;
        const raw = (sJ * cardWidth) / 2 + cfg.gap * gapScale + (sJ1 * cardWidth) / 2;
        // At extreme gapFalloffPerStep/gap combinations the raw overlap can exceed the
        // cards' own (minScale-floored) half-widths, which would flip this segment negative
        // and make farther cards fold back in front of their nearer neighbors instead of
        // just stacking behind them. Floor it just above zero so cards can overlap almost
        // completely without ever crossing out of index order.
        return Math.max(4, raw);
      };

      const anchorLen = segmentLength(base);
      offsets[base] = -frac * anchorLen;
      offsets[base + 1] = (1 - frac) * anchorLen;

      let acc = offsets[base + 1];
      for (let i = base + 2; i < count; i++) {
        acc += segmentLength(i - 1);
        offsets[i] = acc;
      }
      acc = offsets[base];
      for (let i = base - 1; i >= 0; i--) {
        acc -= segmentLength(i);
        offsets[i] = acc;
      }
      return offsets;
    }

    function applyTransforms(step: number) {
      const cards = cardRefs.current;
      if (!cards) return;
      const cfg = configRef.current;
      const { containerWidth, cardWidth } = state;
      if (!containerWidth || !cardWidth) return;

      const nearestIndex = Math.max(
        0,
        Math.min(count - 1, Math.round((state.scrollCenter - cardWidth / 2) / step)),
      );
      if (nearestIndex !== lastCenterIndex) {
        lastCenterIndex = nearestIndex;
        onCenterIndexChangeRef.current?.(nearestIndex);
      }

      // scrollCenter lives in the same `i*step + cardWidth/2` space as each card's own
      // trackCenterX (see centerOnIndexImplRef below) — subtracting cardWidth/2 here
      // converts it to plain index units, matching nearestIndex's formula above. Omitting
      // this previously left every card's scale/rotation/gap-offset ~half a step off center.
      const centerFraction = step !== 0 ? (state.scrollCenter - cardWidth / 2) / step : 0;
      const offsets = computeCenterOffsets(centerFraction, cardWidth, cfg);

      for (let i = 0; i < count; i++) {
        const el = cards[i];
        if (!el) continue;
        const distanceInSteps = i - centerFraction;
        const offset = offsets[i];
        const left = containerWidth / 2 + offset - cardWidth / 2;

        const scale = depthScaleAt(distanceInSteps, cfg);
        const rotateY = Math.max(-70, Math.min(70, -distanceInSteps * cfg.cardCurve));
        const zIndex = Math.round(10000 - Math.abs(offset));
        const depthTint = Math.min(cfg.maxDepthTint, Math.abs(distanceInSteps) * cfg.depthTintPerStep);

        el.style.transform =
          `translate3d(${left.toFixed(2)}px, -50%, 0) ` +
          `rotateX(${cfg.cameraTilt}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        el.style.zIndex = String(zIndex);
        el.style.setProperty('--depth-tint', depthTint.toFixed(3));
      }
    }

    function frame(now: number) {
      if (!state.lastFrameT) state.lastFrameT = now;
      const dt = Math.min(now - state.lastFrameT, 48);
      state.lastFrameT = now;
      const cfg = configRef.current;
      const step = cardStep();
      const { min, max } = bounds();

      if (state.mode === 'momentum') {
        state.scrollCenter += state.velocity * dt;
        state.velocity *= Math.exp(-cfg.momentumFriction * dt);

        if (state.scrollCenter < min || state.scrollCenter > max) {
          state.snapTarget = state.scrollCenter < min ? min : max;
          state.mode = 'snap';
        } else if (Math.abs(state.velocity) < cfg.snapVelocityThreshold) {
          // Momentum has decayed to a stop — settle here rather than snapping to
          // whichever card happens to be nearest at this instant.
          state.velocity = 0;
          state.mode = 'idle';
        }
      } else if (state.mode === 'snap') {
        const target = state.snapTarget ?? state.scrollCenter;
        const t = 1 - Math.exp(-dt / cfg.snapTauMs);
        state.scrollCenter += (target - state.scrollCenter) * t;
        if (Math.abs(target - state.scrollCenter) < 0.25) {
          state.scrollCenter = target;
          state.mode = 'idle';
          state.snapTarget = null;
        }
      } else if (state.mode === 'idle') {
        if (state.scrollCenter < min || state.scrollCenter > max) {
          const target = state.scrollCenter < min ? min : max;
          const t = 1 - Math.exp(-dt / cfg.snapTauMs);
          state.scrollCenter += (target - state.scrollCenter) * t;
        }
      }
      // 'drag' mode needs no per-frame physics — handlePointerMove already wrote scrollCenter.

      applyTransforms(step);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
    };
    // Re-run only when structural inputs change; config is read live via configRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, cardRefs, count]);

  return { centerOnIndex };
}
