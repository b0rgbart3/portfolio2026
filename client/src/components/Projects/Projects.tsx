import React, { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./Projects.module.scss";
import projectsData from "../../data/projects.json";
import ProjectPanel from "./ProjectPanel";

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

const Projects: React.FC = () => {
  const projects: Project[] = projectsData;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const selectedProject =
    selectedIndex !== null ? projects[selectedIndex] : null;

  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!isInView) return;

    const HIGHLIGHT_DURATION = 180;
    const SEQUENCE_START = 2400;
    const timers: ReturnType<typeof setTimeout>[] = [];

    projects.forEach((_, index) => {
      const start = SEQUENCE_START + index * HIGHLIGHT_DURATION;
      timers.push(setTimeout(() => setHighlightedIndex(index), start));
      timers.push(
        setTimeout(() => setHighlightedIndex(null), start + HIGHLIGHT_DURATION),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const handlePrev = () =>
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const handleNext = () =>
    setSelectedIndex((i) =>
      i !== null && i < projects.length - 1 ? i + 1 : i,
    );

  return (
    <section className={styles.projects} id="projects">
      <div className={styles.header}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Projects
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          A selection of things that I've built — from full-stack apps to client
          sites.
          <p
            style={{
              fontStyle: "italic",
              opacity: 0.85,
              fontFamily: "serif",
              color: "#5487a1",
              fontSize: "1.2rem",
              paddingTop: "8px",
            }}
          >
            Note that the work done for Grid Dynamics as a private enterprise is
            proprietary, so I'm not able to include that work in this list of
            projects.
          </p>
        </motion.p>
      </div>

      <div className={styles.grid} ref={gridRef}>
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            className={`${styles.card} ${highlightedIndex === index ? styles.cardHighlighted : ""}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 1.5 - index * 0.1,
              delay: 1 + index * 0.18,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={() => setSelectedIndex(index)}
          >
            <h3>{project.title}</h3>
            <p>{project.intro}</p>
          </motion.div>
        ))}
      </div>

      <ProjectPanel
        project={selectedProject}
        onClose={() => setSelectedIndex(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={selectedIndex === 0}
        isLast={selectedIndex === projects.length - 1}
      />
    </section>
  );
};

export default Projects;
