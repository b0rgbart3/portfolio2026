import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import styles from "./Hero.module.scss";
import profilePic from "../../assets/bart_dority_profile4.png";

interface HeroProps {
  onOpenAI: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenAI }) => {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.content}>
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles["status-badge"]}>
            <span className={styles.dot}></span>
            Seeking Staff+ opportunities at product-driven companies.
          </div>

          <h1>Bart Dority</h1>
          <h2 className={styles.title}>AI Native Software Engineer</h2>

          <p className={styles.description}>
            Elegantly hand-crafted digital experiences
          </p>

          <div className={styles.tags}>
            {["Grid Dynamics", "Dority Design Works"].map((tag) => (
              <a
                key={tag}
                href={`#${tag.toLowerCase().replace(/\s+/g, "-")}`}
                className={styles.tag}
              >
                {tag}
              </a>
            ))}
          </div>

          <div className={styles["cta-container"]}>
            <button className={styles["main-cta"]} onClick={onOpenAI}>
              <MessageSquare size={20} />
              Ask AI About Me
            </button>
            <span className={styles["new-badge"]}>New</span>
          </div>
        </motion.div>

        <motion.div
          className={styles.right}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          <div className={styles["image-wrapper"]}>
            <img src={profilePic} alt="Bart Dority" />
          </div>
        </motion.div>
      </div>

      <div className={styles["scroll-hint"]}>
        SCROLL TO EXPLORE
        <div className={styles.line}></div>
      </div>
    </section>
  );
};

export default Hero;
