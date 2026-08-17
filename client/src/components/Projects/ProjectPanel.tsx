import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./ProjectPanel.module.scss";
import type { Project } from "./types";
import { getProjectImageUrl } from "../../utils/projectImages";
import GithubIcon from "../sharedLibrary/icons/GithubIcon";

/** Minimum horizontal travel, px, before a touch gesture counts as a swipe rather
 *  than a tap or an incidental finger wobble while scrolling the description. */
const SWIPE_THRESHOLD_PX = 50;

interface ProjectPanelProps {
  project: Project | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ProjectPanel: React.FC<ProjectPanelProps> = ({
  project,
  onClose,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  // Mobile drops the prev/next arrow buttons (see .navBtn's display:none under the
  // 700px breakpoint) in favor of swiping the panel itself — tracked here rather than
  // via a drag library since it's a single one-shot gesture, not a draggable surface.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    // Require the swipe to be more horizontal than vertical so scrolling the
    // description text (a vertical gesture) never gets mistaken for a page turn.
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0 && !isLast) onNext();
    else if (deltaX > 0 && !isFirst) onPrev();
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h2>
                Project:
                <span className={styles.projectTitle}>{project.title}</span>
              </h2>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={styles.body}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className={styles.mobileImageContainer}>
                <div className={styles.imageWrapper}>
                  {project.images[0] && (
                    <img
                      src={getProjectImageUrl(project.images[0])}
                      alt={project.title}
                      className={styles.image}
                    />
                  )}
                </div>

                {!isFirst && (
                  <button
                    className={`${styles.navBtn} ${styles.navBtnLeft}`}
                    onClick={onPrev}
                    aria-label="Previous project"
                  >
                    <ArrowLeft size={26} />
                  </button>
                )}
                {!isLast && (
                  <button
                    className={`${styles.navBtn} ${styles.navBtnRight}`}
                    onClick={onNext}
                    aria-label="Next project"
                  >
                    <ArrowRight size={26} />
                  </button>
                )}
              </div>

              <div className={styles.details}>
                <p className={styles.description}>{project.description}</p>

                <div className={styles.techSection}>
                  <h4>Tech Stack</h4>
                  <div className={styles.techList}>
                    {project.tech.map((t) => (
                      <span key={t} className={styles.techPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.links}>
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkBtn}
                    >
                      <GithubIcon size={16} />
                      GitHub Repo
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.linkBtn} ${styles.primary}`}
                    >
                      <ExternalLink size={16} />
                      Live Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectPanel;
