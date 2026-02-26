import React from "react";
import { motion } from "framer-motion";
import { Check, Circle, X } from "lucide-react";
import styles from "./FitCheck.module.scss";

const strong = [
  "UI design & development",
  "User experience",
  "Component architectural design",
  "Engineering mentorship",

  "Design & branding",
  "Code reviews",
  "Solo contributor",
];

const moderate = [
  "Cross-functional leadership",
  "AI integration",
  "Agentic workflow architectural design",
  "Data engineering",
  "Team building",
  "Mobile development",
];

const gaps = [
  "Database design & maintenance",
  "Performance optimization",
  "Security & compliance",
  "Production deployments",
];

const FitCheck: React.FC = () => {
  return (
    <section className={styles.fitCheck} id="fit-check">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Honest Fit Assessment</h2>
          <p>
            Where I'm strong, where I'm competent, and where I'm still growing
            (I'll tell you upfront)
          </p>
        </motion.div>

        <div className={styles.grid}>
          {/* STRONG */}
          <motion.div
            className={`${styles.card} ${styles.cardStrong}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelStrong}`}>
              Strong
            </div>
            <ul>
              {strong.map((item) => (
                <li key={item}>
                  <Check size={14} className={styles.iconStrong} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* MODERATE */}
          <motion.div
            className={`${styles.card} ${styles.cardModerate}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelModerate}`}>
              Moderate
            </div>
            <ul>
              {moderate.map((item) => (
                <li key={item}>
                  <Circle size={14} className={styles.iconModerate} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* GAPS */}
          <motion.div
            className={`${styles.card} ${styles.cardGaps}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={`${styles.cardLabel} ${styles.labelGaps}`}>
              Growing Edges
            </div>
            <ul>
              {gaps.map((item) => (
                <li key={item}>
                  <X size={14} className={styles.iconGaps} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FitCheck;
