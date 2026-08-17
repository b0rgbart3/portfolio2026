import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Project } from '../Projects/types';
import { DEFAULT_CONFIG } from './config';
import { useCarouselEngine } from './useCarouselEngine';
import { Card } from './Card';
import './Carousel.css';

const ANIMATION_MS = 400;

interface CarouselProps {
  projects: Project[];
  onActivate: (index: number) => void;
}

export function Carousel({ projects, onActivate }: CarouselProps) {
  const config = DEFAULT_CONFIG;
  const [centerIndex, setCenterIndex] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animTimeoutRef = useRef<number | undefined>(undefined);
  // Bridges the engine's onTap (needed at hook-call time) to handleActivate, which is
  // defined afterward since it needs centerOnIndex — the hook's own return value.
  const activateRef = useRef<(index: number) => void>(() => {});

  const { centerOnIndex } = useCarouselEngine(viewportRef, cardRefs, projects.length, config, {
    onCenterIndexChange: setCenterIndex,
    onPressChange: setIsPressed,
    onTap: (index) => activateRef.current(index),
  });

  // The engine only auto-centers on its very first measurement; a later change of the
  // `projects` array (e.g. the category filter narrowing the set) leaves scrollCenter
  // wherever it was, which can land outside the new, shorter track. Re-center explicitly
  // whenever the displayed set itself changes, landing on its middle — `centerIndex` itself
  // updates on the next animation frame via the engine's own onCenterIndexChange.
  //
  // For an odd count, (count-1)/2 is already a whole index (an actual card sits dead
  // center). For an even count it's a half-index — deliberately left unrounded so the
  // *viewport* centers in the gap between the two middle cards, rather than snapping
  // onto one of them and looking off-center. centerOnIndex/the offset math downstream
  // both already work with a fractional target.
  useEffect(() => {
    if (projects.length === 0) return;
    const middle = (projects.length - 1) / 2;
    centerOnIndex(middle);
  }, [projects, centerOnIndex]);

  const flashAnimating = useCallback((index: number) => {
    setAnimatingIndex(index);
    window.clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = window.setTimeout(() => setAnimatingIndex(null), ANIMATION_MS);
  }, []);

  const handleActivate = useCallback(
    (index: number) => {
      centerOnIndex(index);
      flashAnimating(index);
      onActivate(index);
    },
    [centerOnIndex, onActivate, flashAnimating],
  );

  useEffect(() => {
    activateRef.current = handleActivate;
  }, [handleActivate]);

  useEffect(() => () => window.clearTimeout(animTimeoutRef.current), []);

  const baseCssVars: CSSProperties & Record<string, string | number> = {
    '--card-width': `clamp(200px, 58vw, ${config.cardWidthMax}px)`,
    '--card-height': `calc(var(--card-width) * ${config.cardAspect})`,
    '--camera-perspective': `${config.perspective}px`,
  };

  return (
    <div className="carousel-page">
      <div
        className={`carousel-viewport ${isPressed ? 'is-dragging' : ''}`}
        ref={viewportRef}
        style={baseCssVars}
      >
        <div className="carousel-track">
          {projects.map((project, i) => (
            <Card
              key={project.title}
              project={project}
              index={i}
              isCenter={i === centerIndex}
              isPressed={isPressed && i === centerIndex}
              isAnimating={i === animatingIndex}
              onActivate={handleActivate}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
