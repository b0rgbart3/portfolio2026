import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import styles from "./Experience.module.scss";

interface BusinessContext {
  situation: string;
  approach: string;
  technicalWork: string;
  lessonsLearned: string;
}

interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
  businessContext: BusinessContext;
}

const experiences: ExperienceItem[] = [
  {
    company: "Grid Dynamics",
    role: "UI Focused Full Stack Software Engineer",
    duration: "2021—Current",
    bullets: [
      "Built complex, data-intensive UI features for a fintech reporting platform serving enterprise clients managing hundreds of accounts, improving clarity and performance at scale.",
      "Architected scalable front-end systems using React, TypeScript, Material UI, Sass, and MobX, integrating seamlessly with Node.js APIs to deliver fast, reliable, and predictable user experiences.",
      "Drove cross-functional delivery in agile sprints, translating complex business requirements into intuitive, production-ready components shipped on a consistent two-week cadence.",
      "Strengthened engineering velocity and reliability by contributing to CI/CD pipelines (Jenkins, GitLab, OpenShift) and leveraging AI-assisted tooling to accelerate development and improve test coverage.",
    ],
    businessContext: {
      situation:
        "Enterprise fintech clients needed extensive filtering capabilities to manage financial reports across hundreds of accounts  — existing platform didn't offer customization of reports.",
      approach:
        "Built a scalable, component-driven UI system that prioritized speed and predictability, ensuring clients had a high degree of customization at their fingertips - and financial data was reliable.",
      technicalWork:
        "Engineered data-intensive React/TypeScript components with MobX state management, integrated Node.js APIs, and shipped features consistently on a monthly deployment cadence.",
      lessonsLearned:
        "UI systems benefit from modularization, and components should be designed with asynchronous data flow architectures from the ground up.  When API contracts are consistent and predictable it makes product development flow faster.",
    },
  },
  {
    company: "Dority Design Works",
    role: "Freelance Web Designer →  Developer → UI Engineer",
    duration: "2005—2021",
    bullets: [
      "Led brand and visual identity development, creating logos, style guides, and cohesive marketing assets across print and digital media (brochures, business cards, websites), partnering closely with clients and creative teams to refine concepts and align with business goals.",
      "Designed and built responsive, mobile-first websites, translating brand systems into polished, user-centered front-end experiences with intuitive UX and seamless cross-device performance.",
      "Engineered and deployed database-driven applications using PHP, MySQL, and cloud platforms including AWS and Heroku, managing hosting, scalability, performance optimization, and long-term maintenance.",
      "Recognized with a Silver Caddy Award for Creative Excellence for the Jeep Liberty website, highlighting strengths in visual design, interaction, and front-end execution.",
      "Built long-term relationships with clients including KQED, Doremus Advertising, Organic Inc., SF Long-Term Care Coordinating Council, artists and authors in the U.S. and internationally.",
    ],
    businessContext: {
      situation:
        "Clients needed a partner who could move fluidly across brand strategy, visual design, and shipped software — without losing coherence between disciplines or handing off to a different vendor at each stage.",
      approach:
        "Built integrated workflows that connected brand identity, design systems, and full-stack execution under one roof, turning individual projects into long-term partnerships grounded in trust.",
      technicalWork:
        "Designed brand systems and responsive websites, built and deployed database-driven apps on AWS and Heroku using PHP and MySQL. Earned a Silver Caddy Award for Creative Excellence for the Jeep Liberty site.",
      lessonsLearned:
        "Robust and flexible design systems and visual assets simplify the development of every additional project.",
    },
  },
];

const Experience: React.FC = () => {
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  const toggleCard = (company: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  };

  return (
    <section className={styles.experience} id="experience">
      <div className={styles.header}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Experience
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Each role includes business context — the real story behind the bullet
          points.
        </motion.p>
      </div>

      <div className={styles.cards}>
        {experiences.map((exp, index) => {
          const isOpen = openCards.has(exp.company);
          return (
            <motion.div
              key={exp.company}
              id={exp.company.toLowerCase().replace(/\s+/g, "-")}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={styles["card-header"]}>
                <div className={styles["company-info"]}>
                  <h3>{exp.company}</h3>
                  <div className={styles.role}>{exp.role}</div>
                </div>
                <div className={styles.duration}>{exp.duration}</div>
              </div>

              <ul className={styles["bullet-points"]}>
                {exp.bullets.map((bullet, i) => (
                  <li key={i}>
                    <ArrowRight size={14} className={styles.icon} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`${styles["ai-toggle"]} ${isOpen ? styles["ai-toggle--open"] : ""}`}
                onClick={() => toggleCard(exp.company)}
                role="button"
                aria-expanded={isOpen}
              >
                <BookOpen size={14} className={styles.sparkle} />
                <span>
                  {isOpen ? "Hide business context" : "View business context"}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className={styles.chevron}
                >
                  <ChevronDown size={14} />
                </motion.span>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="context"
                    className={styles["business-context"]}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className={styles["business-context-inner"]}>
                      <div className={styles["context-row"]}>
                        <span className={styles["context-label"]}>
                          Situation
                        </span>
                        <p className={styles["context-text"]}>
                          {exp.businessContext.situation}
                        </p>
                      </div>
                      <div className={styles["context-row"]}>
                        <span className={styles["context-label"]}>
                          Approach
                        </span>
                        <p className={styles["context-text"]}>
                          {exp.businessContext.approach}
                        </p>
                      </div>
                      <div className={styles["context-row"]}>
                        <span className={styles["context-label"]}>
                          Technical Work
                        </span>
                        <p className={styles["context-text"]}>
                          {exp.businessContext.technicalWork}
                        </p>
                      </div>
                      <div className={styles["context-row"]}>
                        <span className={styles["context-label"]}>
                          Lessons Learned
                        </span>
                        <p
                          className={`${styles["context-text"]} ${styles["context-text--quote"]}`}
                        >
                          {exp.businessContext.lessonsLearned}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Experience;
