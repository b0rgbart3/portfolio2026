import React from "react";
import styles from "./Footer.module.scss";
import IconLink from "../sharedLibrary/IconLink/IconLink";
import GithubIcon from "../sharedLibrary/icons/GithubIcon";
import LinkedInIcon from "../sharedLibrary/icons/LinkedInIcon";
import MailIcon from "../sharedLibrary/icons/MailIcon";

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
          <IconLink
            href="https://github.com/b0rgbart3/"
            icon={GithubIcon}
            label="GitHub"
            external
            variant="button"
            iconSize={20}
            className=""
          />
          <IconLink
            href="https://www.linkedin.com/in/bart-dority/"
            icon={LinkedInIcon}
            label="LinkedIn"
            external
            variant="button"
            iconSize={20}
            className=""
          />
          <IconLink
            href="mailto:jobs4bart@gmail.com"
            icon={MailIcon}
            label="Email"
            variant="button"
            iconSize={20}
            className=""
          />
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
