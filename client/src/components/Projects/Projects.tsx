import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  category: string;
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Data Visualizations", value: "data-viz" },
  { label: "Agentic AI", value: "ai" },
  { label: "Fullstack Apps", value: "fullstack" },
  { label: "Games", value: "games" },
  { label: "Client Work", value: "client" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    getIndexFromUrl(projectsData as Project[]),
  );

  const selectedProject =
    selectedIndex !== null ? projects[selectedIndex] : null;

  const displayedProjects = projects
    .map((project, index) => ({ project, index }))
    .filter(
      ({ project }) =>
        activeFilter === "all" || project.category === activeFilter,
    );

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

      <motion.div
        className={styles.filterBar}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <div className={styles.grid}>
        {displayedProjects.map(({ project, index }) => (
          <div
            key={project.title}
            className={styles.card}
            onClick={() => openProject(index)}
          >
            <h3>{project.title}</h3>
            <p>{project.intro}</p>
          </div>
        ))}
      </div>

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
