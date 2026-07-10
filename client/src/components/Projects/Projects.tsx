import React, { useState, useRef, useEffect, useCallback } from "react";
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

function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getIndexFromUrl(projects: Project[]): number | null {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("project");
  if (!slug) return null;
  const idx = projects.findIndex((p) => slugify(p.title) === slug);
  return idx >= 0 ? idx : null;
}

const Projects: React.FC = () => {
  const projects: Project[] = projectsData;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    getIndexFromUrl(projectsData as Project[]),
  );
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const selectedProject =
    selectedIndex !== null ? projects[selectedIndex] : null;

  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, amount: 0.2 });

  const openProject = useCallback(
    (index: number | null) => {
      setSelectedIndex(index);
      const url = new URL(window.location.href);
      if (index !== null) {
        const slug = slugify(projects[index].title);
        url.searchParams.set("project", slug);
        gtag("event", "project_viewed", { project_name: slug });
      } else {
        url.searchParams.delete("project");
      }
      window.history.pushState({}, "", url.toString());
    },
    [projects],
  );

  useEffect(() => {
    const onPopState = () => setSelectedIndex(getIndexFromUrl(projects));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [projects]);

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
    setSelectedIndex((i) => {
      const next = i !== null && i > 0 ? i - 1 : i;
      if (next !== null && next !== i) {
        const url = new URL(window.location.href);
        url.searchParams.set("project", slugify(projects[next].title));
        window.history.pushState({}, "", url.toString());
      }
      return next;
    });
  const handleNext = () =>
    setSelectedIndex((i) => {
      const next = i !== null && i < projects.length - 1 ? i + 1 : i;
      if (next !== null && next !== i) {
        const url = new URL(window.location.href);
        url.searchParams.set("project", slugify(projects[next].title));
        window.history.pushState({}, "", url.toString());
      }
      return next;
    });

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
          <p className={styles["header-note"]}>
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
            onClick={() => openProject(index)}
          >
            <h3>{project.title}</h3>
            <p>{project.intro}</p>
          </motion.div>
        ))}
      </div>

      {/* <div className={styles.grid2}>
        {projects.map((project, index) => (
          <motion.div
            key={`bloat-${project.title}`}
            className={styles.cardBloat}
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
            <div className={styles.cardBloatContent}>
              <h3>{project.title}</h3>
              <p>{project.intro}</p>
            </div>
          </motion.div>
        ))}
      </div> */}

      <ProjectPanel
        project={selectedProject}
        onClose={() => openProject(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={selectedIndex === 0}
        isLast={selectedIndex === projects.length - 1}
      />
    </section>
  );
};

export default Projects;
