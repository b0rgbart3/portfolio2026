import { forwardRef } from 'react';
import type { Project } from '../Projects/types';
import { getProjectImageUrl } from '../../utils/projectImages';
import './Card.css';

interface CardProps {
  project: Project;
  index: number;
  isCenter: boolean;
  isPressed: boolean;
  isAnimating: boolean;
  onActivate: (index: number) => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { project, index, isCenter, isPressed, isAnimating, onActivate },
  ref,
) {
  const imageUrl = project.images[0] ? getProjectImageUrl(project.images[0]) : '';
  const className = [
    'card',
    isCenter && 'is-center',
    isPressed && 'is-pressed',
    isAnimating && 'is-animating',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={className}
      data-index={index}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(index);
        }
      }}
    >
      <div
        className="card-art"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="card-body">
        <h2 className="card-title">{project.title}</h2>
        <p className="card-blurb">{project.intro}</p>
      </div>
    </div>
  );
});
