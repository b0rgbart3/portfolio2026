import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./ProjectPanel.module.scss";

const projectImages = import.meta.glob(
  "../../assets/projects/*.{jpg,png,jpeg}",
  { eager: true },
);

function getImageUrl(imageName: string): string {
  const key = `../../assets/projects/${imageName}`;
  return (projectImages[key] as { default: string })?.default ?? "";
}

interface Project {
  title: string;
  description: string;
  intro: string;
  images: string[];
  live: string;
  github: string;
  features: string[];
  tech: string[];
  shields: string[];
}

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

            <div className={styles.body}>
              <div className={styles.mobileImageContainer}>
                <div className={styles.imageWrapper}>
                  {project.images[0] && (
                    <img
                      src={getImageUrl(project.images[0])}
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
                    <ArrowLeft size={20} />
                  </button>
                )}
                {!isLast && (
                  <button
                    className={`${styles.navBtn} ${styles.navBtnRight}`}
                    onClick={onNext}
                    aria-label="Next project"
                  >
                    <ArrowRight size={20} />
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
                      <Github size={16} />
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
