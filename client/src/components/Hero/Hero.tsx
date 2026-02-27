import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import styles from "./Hero.module.scss";
import profilePic from "../../assets/bart_dority_profile4.png";
import cvPdf from "../../assets/Bart Dority CV.pdf";
import pdfIcon from "../../assets/pdf_icon.svg";

interface HeroProps {
  onOpenAI: () => void;
}

const ABOUT_TEXT = `I'm a front-end focused, fullstack software engineer with a passion for well-designed interfaces. I am AI Native because I use a variety of AI tools and have incorporated them into my workflow.  I work across the stack with a focus on building intuitive and responsive apps using modern JavaScript frameworks.

With a background in design, animation, and advertising, I care about both the user experience and the system architecture. I enjoy collaborating with product designers and engineers to develop elegant solutions to complex problems. I'm endlessly curious and always learning.`;

const Hero: React.FC<HeroProps> = ({ onOpenAI }) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aboutOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [aboutOpen]);

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
            <button
              ref={btnRef}
              className={styles["about-btn"]}
              onClick={() => setAboutOpen((v) => !v)}
            >
              About Bart
            </button>
            <div className={styles["main-cta-wrapper"]}>
              <button className={styles["main-cta"]} onClick={onOpenAI}>
                <MessageSquare size={20} />
                Ask AI About Bart
              </button>
              <span className={styles["new-badge"]}>New</span>
            </div>
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

      {createPortal(
        <AnimatePresence>
          {aboutOpen && (
            <motion.div
              ref={panelRef}
              className={styles["about-panel"]}
              initial={{
                opacity: 0,
                x: "-50%",
                y: "calc(-50% + 10px)",
                scale: 0.97,
              }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={{
                opacity: 0,
                x: "-50%",
                y: "calc(-50% + 10px)",
                scale: 0.97,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                className={styles["about-panel-close"]}
                onClick={() => setAboutOpen(false)}
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <p className={styles["about-bart-title"]}>Bart Dority</p>
              {ABOUT_TEXT.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              <motion.a
                href={cvPdf}
                target="_blank"
                rel="noopener noreferrer"
                className={styles["cv-link"]}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <img src={pdfIcon} alt="" className={styles["cv-icon"]} />
                Bart's CV
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <div className={styles["scroll-hint"]}>
        SCROLL TO EXPLORE
        <div className={styles.line}></div>
      </div>
    </section>
  );
};

export default Hero;
