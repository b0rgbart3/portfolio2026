import React from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import styles from "./Footer.module.scss";

interface FooterProps {
  onOpenAIBuildInfo: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAIBuildInfo }) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.divider} />
      <div className={styles.wrapper}>
        <div className={styles.identity}>
          <h2 className={styles.name}>Bart Dority</h2>
          <p className={styles.title}>
            AI Native Software Engineer · UI Focused Fullstack
          </p>
        </div>
        <div className={styles.icons}>
          <a
            href="https://github.com/b0rgbart3/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles["icon-btn"]}
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://www.linkedin.com/in/bart-dority/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles["icon-btn"]}
            aria-label="LinkedIn"
          >
            <Linkedin size={20} />
          </a>
          <a
            href="mailto:jobs4bart@gmail.com"
            className={styles["icon-btn"]}
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>
      </div>
      <p className={styles.tagline}>
        This portfolio includes a custom built retrieval-augmented generation
        (RAG) agentic AI system
        <br />
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenAIBuildInfo(); }}>Learn more about how I built this.</a>
        <br />
        <br />
      </p>
    </footer>
  );
};

export default Footer;
