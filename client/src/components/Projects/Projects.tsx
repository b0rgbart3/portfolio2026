import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./Projects.module.scss";
import projectsData from "../../data/projects.json";
import { Carousel } from "../carousel/Carousel";
import ProjectPanel from "./ProjectPanel";
import type { Project } from "./types";
import { slugify } from "../../utils/slug";

const FILTERS = [
  { label: "All", mobileLabel: "ALL", value: "all" },
  { label: "Data Visualizations", mobileLabel: "DATA", value: "data-viz" },
  { label: "Best Four", mobileLabel: "Best", value: "best-four" },
  { label: "Agentic AI", mobileLabel: "AI", value: "ai" },
  { label: "Fullstack Apps", mobileLabel: "Fullstack", value: "fullstack" },
  { label: "Games", mobileLabel: "Games", value: "games" },
  { label: "Client Work", mobileLabel: "Clients", value: "client" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

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
    getIndexFromUrl(projects),
  );

  const displayedProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          activeFilter === "all" || project.category.includes(activeFilter),
      ),
    [projects, activeFilter],
  );

  const openProject = useCallback(
    (index: number | null) => {
      setSelectedIndex(index);
      const url = new URL(window.location.href);
      if (index !== null) {
        const slug = slugify(displayedProjects[index].title);
        url.searchParams.set("project", slug);
        gtag("event", "project_viewed", { project_name: slug });
      } else {
        url.searchParams.delete("project");
      }
      window.history.pushState({}, "", url.toString());
    },
    [displayedProjects],
  );

  useEffect(() => {
    const onPopState = () => {
      const idx = getIndexFromUrl(projects);
      // The URL always identifies a project by slug within the full list, so force
      // the filter to "all" whenever a link resolves — otherwise the active filter
      // could hide the very project the URL points at.
      if (idx !== null) setActiveFilter("all");
      setSelectedIndex(idx);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [projects]);

  const handleFilterChange = (value: FilterValue) => {
    setActiveFilter(value);
    if (selectedIndex !== null) openProject(null);
  };

  const selectedProject =
    selectedIndex !== null ? (displayedProjects[selectedIndex] ?? null) : null;

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || selectedIndex <= 0) return;
    openProject(selectedIndex - 1);
  }, [selectedIndex, openProject]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null || selectedIndex >= displayedProjects.length - 1)
      return;
    openProject(selectedIndex + 1);
  }, [selectedIndex, displayedProjects.length, openProject]);

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
        className={`${styles.filterBar} ${styles.filterBarDesktop}`}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ""}`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        className={`${styles.filterBar} ${styles.filterBarMobile}`}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ""}`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.mobileLabel}
          </button>
        ))}
      </motion.div>

      <div className={styles.carouselWrap}>
        <Carousel
          projects={displayedProjects}
          onActivate={(index) => openProject(index)}
        />
      </div>

      <ProjectPanel
        project={selectedProject}
        onClose={() => openProject(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={selectedIndex === 0}
        isLast={selectedIndex === displayedProjects.length - 1}
      />
    </section>
  );
};

export default Projects;
