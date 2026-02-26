import React from "react";
import { motion } from "framer-motion";
import styles from "./Skills.module.scss";

interface SkillCard {
  title: string;
  skills: string[];
}

const row1: SkillCard[] = [
  {
    title: "Front-End & UI Engineering",
    skills: [
      "React",
      "TypeScript",
      "JavaScript (ES6+)",
      "HTML5 / CSS3 / SCSS",
      "MobX",
      "Sass",
      "Material UI",
      "Flutter / Dart",
      "Angular",
      "Objective C / Swift",
      "Ruby on Rails",
      "Wordpress / PHP",
    ],
  },
  {
    title: "Design & Prototyping",
    skills: [
      "Responsive Design",
      "Adobe Creative Suite",
      "Figma",
      "Design Systems",
      "Brand Identity",
      "Typography",
      "Wireframing",
      "UI/UX Design",
    ],
  },
  {
    title: "AI Tools & Techniques",
    skills: [
      "Claude Code",
      "Antigravity",
      "Perplexity",
      "Claude / ChatGPT",
      "Gemini / Grok",
      "LangChain / LangGraph",
      "LanceDB / Embedding",
      "Prompt Engineering",
      "Agentic RAG Pipelines",
    ],
  },
  {
    title: "Back-End & API Integration",
    skills: [
      "Python",
      "Node.js",
      "REST APIs",
      "Express",
      "Mongoose",
      "GraphQL",
      "PHP",
    ],
  },
];

const row2: SkillCard[] = [
  {
    title: "Databases",
    skills: [
      "MongoDB",
      "MySQL",
      "PostgreSQL",
      "LanceDB (vector)",
      "Database-driven Apps",
    ],
  },
  {
    title: "Testing & Quality",
    skills: [
      "Jest & Enzyme",
      "React Testing Library",
      "Code Reviews",
      "Unit & Integration Testing",
      "Test Coverage",
    ],
  },
  {
    title: "DevOps & Tooling",
    skills: [
      "AWS",
      "Heroku",
      "Git / GitHub / GitLab",
      "Jenkins",
      "GitLab CI",
      "OpenShift",
      "Docker",
      "npm / yarn",
    ],
  },
  {
    title: "Additional Skills",
    skills: [
      "Agile / Scrum",
      "Technical Mentorship",
      "Client Relations",
      "Solo Contributor",
      "Art direction",
      "Print & Digital Media",
    ],
  },
];

const SkillCardComponent: React.FC<{
  card: SkillCard;
  delay: number;
  variant: "green" | "blue";
}> = ({ card, delay, variant }) => (
  <motion.div
    className={`${styles.card} ${variant === "green" ? styles.cardGreen : styles.cardBlue}`}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <div
      className={`${styles.cardTitle}${variant === "blue" ? ` ${styles.cardTitleBlue}` : ""}`}
    >
      {card.title}
    </div>
    <ul>
      {card.skills.map((skill) => (
        <li key={skill}>
          <span className={variant === "green" ? styles.dot : styles.dotBlue} />
          <span>{skill}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const Skills: React.FC = () => {
  return (
    <section className={styles.skills} id="skills">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Skills</h2>
          <p>Technologies, tools, and disciplines I work with</p>
        </motion.div>

        <div className={styles.row}>
          {row1.map((card, i) => (
            <SkillCardComponent
              key={card.title}
              card={card}
              delay={0.1 + i * 0.1}
              variant="green"
            />
          ))}
        </div>

        <div className={styles.row}>
          {row2.map((card, i) => (
            <SkillCardComponent
              key={card.title}
              card={card}
              delay={0.1 + i * 0.1}
              variant="blue"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
